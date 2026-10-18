import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const approved = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const draft = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const sponsor = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

for (const presentation of [false, true]) {
test(`migration rebuild and PostgreSQL role/RLS denial evidence (${presentation ? '0001 + 0002' : '0001'})`, async t => {
  const db = new PGlite();
  t.after(() => db.close());
  // Harness ONLY: Supabase supplies these roles, auth.users and auth.uid in deployment.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const migration = await readFile(new URL('../supabase/migrations/0001_beacon.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
  if (presentation) await db.exec(await readFile(new URL('../supabase/migrations/0002_listing_presentation.sql', import.meta.url), 'utf8'));
  async function as(role, uid, sql) {
    await db.exec('begin');
    try {
      await db.exec(`set local role ${role}`); // Role/ID are fixed test constants, not user input.
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid || '']);
      return (await db.query(sql)).rows;
    } finally { await db.exec('rollback'); }
  }
  const count = async (role, uid, table, where = '') => Number((await as(role, uid, `select count(*) as n from public.${table} ${where}`))[0].n);
  const denied = async (role, uid, sql, code) => {
    await assert.rejects(as(role, uid, sql), error => error.code === code);
  };
  await t.test('all five exposed tables enable and force RLS', async () => {
    const rows = (await db.query("select relname, relrowsecurity, relforcerowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'")).rows;
    assert.equal(rows.length, 5);
    assert.ok(rows.every(row => row.relrowsecurity && row.relforcerowsecurity));
  });
  await t.test('anonymous sees approved listing, active sponsor and eligible partnership only', async () => {
    for (const table of ['properties', 'sponsors', 'property_sponsors']) assert.equal(await count('anon', null, table), 1);
    assert.equal(await count('anon', null, 'properties', `where id = '${draft}'`), 0);
    await denied('anon', null, 'select * from public.profiles', '42501');
    await denied('anon', null, 'select * from public.inquiries', '42501');
    await denied('anon', null, `update public.properties set title = 'Attack' where id = '${approved}'`, '42501');
  });
  await t.test('owner sees own draft and updates it; approved content is immutable', async () => {
    assert.equal(await count('authenticated', owner, 'properties'), 2);
    assert.equal((await as('authenticated', owner, `update public.properties set title = 'Revised' where id = '${draft}' returning id`)).length, 1);
    assert.equal((await as('authenticated', owner, `update public.properties set title = 'Attack' where id = '${approved}' returning id`)).length, 0);
    assert.equal((await as('authenticated', owner, `update public.sponsors set name = 'Revised' where id = '${sponsor}' returning id`)).length, 1);
    assert.equal((await as('authenticated', owner, "update public.sponsors set name = 'Attack' where active returning id")).length, 0);
  });
  await t.test('other user cannot read or edit another owner draft or inactive sponsor', async () => {
    assert.equal(await count('authenticated', other, 'properties', `where id = '${draft}'`), 0);
    assert.equal((await as('authenticated', other, `update public.properties set title = 'Attack' where id = '${draft}' returning id`)).length, 0);
    assert.equal(await count('authenticated', other, 'sponsors', `where id = '${sponsor}'`), 0);
    assert.equal((await as('authenticated', other, `update public.sponsors set name = 'Attack' where id = '${sponsor}' returning id`)).length, 0);
  });
  await t.test('owners cannot self-approve, activate sponsors, transfer ownership or delete', async () => {
    for (const set of ['approved = true', `owner_id = '${other}'`]) {
      await denied('authenticated', owner, `update public.properties set ${set} where id = '${draft}'`, '42501');
    }
    await denied('authenticated', owner, `update public.sponsors set active = true where id = '${sponsor}'`, '42501');
    await denied('authenticated', owner, `delete from public.properties where id = '${draft}'`, '42501');
    await denied('authenticated', owner, `update public.profiles set id = '${other}' where id = '${owner}'`, '42501');
  });
  await t.test('owner inserts draft only; spoofed ownership, approval and invalid values fail', async () => {
    const columns = 'owner_id,title,description,city,rent_cents';
    const values = `'${owner}','New','Fictional','Sample',100`;
    assert.equal((await as('authenticated', owner, `insert into public.properties (${columns}) values (${values}) returning id`)).length, 1);
    await denied('authenticated', other, `insert into public.properties (${columns}) values (${values})`, '42501');
    await denied('authenticated', owner, `insert into public.properties (${columns},approved) values (${values},true)`, '42501');
    await denied('authenticated', owner, `insert into public.properties (${columns}) values ('${owner}','Bad','Demo','Sample',-1)`, '23514');
    await denied('authenticated', owner, `insert into public.profiles (id,display_name) values ('33333333-3333-4333-8333-333333333333','Spoofed')`, '42501');
  });
  await t.test('private inquiries restricted to sender; only approved properties accept inquiries', async () => {
    assert.equal(await count('authenticated', owner, 'inquiries'), 0);
    assert.equal(await count('authenticated', other, 'inquiries'), 1);
    const insert = (property, sender) => `insert into public.inquiries (property_id,sender_id,message) values ('${property}','${sender}','Fictional test') returning id`;
    assert.equal((await as('authenticated', other, insert(approved, other))).length, 1);
    await denied('authenticated', owner, insert(approved, other), '42501');
    await denied('authenticated', owner, insert(draft, owner), '42501');
    await denied('authenticated', other, "update public.inquiries set message = 'Attack'", '42501');
    await denied('authenticated', owner, `insert into public.property_sponsors (property_id,sponsor_id) values ('${draft}','${sponsor}')`, '42501');
  });
  if (presentation) await t.test('new display columns inherit owner-only writes and enforce checks', async () => {
    assert.equal((await as('authenticated', owner, `update public.properties set bedrooms = 2, property_type = 'apartment' where id = '${draft}' returning id`)).length, 1);
    assert.equal((await as('authenticated', other, `update public.properties set bedrooms = 2 where id = '${draft}' returning id`)).length, 0);
    assert.equal((await as('authenticated', owner, `update public.properties set bedrooms = 2 where id = '${approved}' returning id`)).length, 0);
    for (const field of ["bedrooms = -1", "bathrooms = 1.25", "bathrooms = 1.01", "state = 'California'", "property_type = 'castle'", "image_url = 'https://example.invalid/image.svg'", "amenities = array['unlisted']"]) {
      await denied('authenticated', owner, `update public.properties set ${field} where id = '${draft}'`, '23514');
    }
    const uiSeed = await readFile(new URL('../supabase/seed-ui.sql', import.meta.url), 'utf8');
    await db.exec(uiSeed);
    await db.exec(uiSeed); // Re-running presentation fixtures must not duplicate/overwrite data.
    assert.equal(await count('anon', null, 'properties'), 6);
    assert.equal(await count('anon', null, 'sponsors'), 6);
    assert.equal(await count('anon', null, 'property_sponsors'), 10);
    // Restore baseline for the remaining tests (only fixed fictional presentation IDs).
    await db.exec("delete from public.properties where id::text like '10000000-%'; delete from public.sponsors where id::text like '20000000-%';");
  });
  await t.test('service role bypass is explicit and foreign keys prevent orphans', async () => {
    assert.equal(await count('service_role', null, 'properties'), 3);
    assert.equal(await count('service_role', null, 'inquiries'), 1);
    assert.equal((await as('service_role', null, `update public.properties set approved = true where id = '${draft}' returning id`)).length, 1);
    await denied('service_role', null, `delete from public.properties where id = '${approved}'`, '23503');
    await denied('service_role', null, `delete from public.profiles where id = '${owner}'`, '23503');
    await db.exec('begin');
    try {
      await db.exec(`delete from public.properties where id = '${draft}'`);
      assert.equal(Number((await db.query(`select count(*) as n from public.property_sponsors where property_id = '${draft}'`)).rows[0].n), 0);
    } finally { await db.exec('rollback'); }
  });
});

}
