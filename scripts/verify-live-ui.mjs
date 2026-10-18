// Read-only live checks. Run with --env-file=.env.local; never prints keys or project URLs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const base = process.env.BEACON_TEST_BASE_URL || 'http://127.0.0.1:3000';
const request = route => fetch(base + route, { signal: AbortSignal.timeout(15000) });
const home = await request('/');
const html = await home.text();
assert.equal(home.status, 200);
assert.match(html, /Neighborhood Listing Platform/);
const policy = home.headers.get('content-security-policy');
assert.match(policy, /nonce-/);
if (process.env.BEACON_VERIFY_PRODUCTION === '1') assert.doesNotMatch(policy, /unsafe-eval|unsafe-inline/);
const nonce = policy.match(/'nonce-([^']+)'/)[1];
assert.ok(html.includes(`nonce="${nonce}"`));
const secondHome = await request('/');
assert.notEqual(secondHome.headers.get('content-security-policy'), policy);
const results = ['PASS: Next.js homepage 200; script nonce matches per-request CSP.'];
for (const route of ['/api/listings', '/api/sponsors', '/api/listings/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '/properties/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '/properties/brookhaven-apartment.svg']) {
  assert.equal((await request(route)).status, 200, route);
  results.push(`PASS: ${route} → HTTP 200.`);
}
for (const route of ['/api/listings/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '/.env.local', '/server/database.js']) {
  assert.equal((await request(route)).status, 404, route);
  results.push(`PASS: ${route} → HTTP 404.`);
}
assert.equal((await fetch(base + '/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) })).status, 401);
results.push('PASS: Unauthenticated POST → HTTP 401.');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
for (const [table, columns] of [['properties','id,approved'], ['sponsors','id,active'], ['property_sponsors','property_id,sponsor_id']]) {
  const { data, error } = await db.from(table).select(columns);
  assert.equal(error, null); assert.ok(data.length > 0);
  if (table === 'properties') assert.ok(data.every(row => row.approved));
  if (table === 'sponsors') assert.ok(data.every(row => row.active));
  results.push(`PASS: Direct anonymous ${table} read → ${data.length} public fixture(s).`);
}
const { data: hidden, error } = await db.from('properties').select('id').eq('id','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
assert.equal(error, null); assert.equal(hidden.length, 0);
results.push('PASS: Direct anonymous draft read → 0 rows.');
for (const table of ['profiles','inquiries']) {
  const { error } = await db.from(table).select('id');
  assert.equal(error?.code, '42501');
  results.push(`PASS: Direct anonymous ${table} read denied → SQLSTATE 42501.`);
}
const { error: migrationError } = await db.from('properties').select('property_type').limit(1);
if (migrationError) assert.equal(migrationError.code, '42703');
results.push(migrationError ? 'INFO: Hosted schema 0001; apply 0002 and optional seed-ui.sql for richer cards.' : 'INFO: Hosted presentation columns available.');
async function walk(dir) {
  return (await Promise.all((await fs.readdir(dir, { withFileTypes: true })).map(async entry => entry.isDirectory() ? walk(path.join(dir,entry.name)) : [path.join(dir,entry.name)]))).flat();
}
const secrets = [process.env.SUPABASE_ANON_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean);
assert.ok(secrets.length > 0, 'Local Supabase configuration required');
for (const file of await walk('.next/static')) {
  const content = await fs.readFile(file, 'utf8');
  assert.ok(!secrets.some(secret => content.includes(secret)), 'Server credential found in client bundle');
}
results.push('PASS: Client build contains no locally configured Supabase API key.');
console.log(results.join('\n'));
