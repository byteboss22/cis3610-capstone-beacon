// Actual Auth sign-in + live API denials. All credentials stay in ignored local env files.
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const owner = '11111111-1111-4111-8111-111111111111';
const draft = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const approved = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const listing = { title: 'Fictional denial test', description: 'Coursework verification only.', city: 'Sample City', rent_cents: 100000 };
const parse = body => { try { return JSON.parse(body); } catch { return null; } };

async function signIn(env) {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: env.BEACON_TEST_EMAIL, password: env.BEACON_TEST_PASSWORD });
    if (error || !data.session) throw new Error();
    const verified = await client.auth.getUser(data.session.access_token);
    if (verified.error || !verified.data.user) throw new Error();
    return { userId: verified.data.user.id, token: data.session.access_token };
  } catch {
    throw new Error('Sign-in failed. Check the local test email/password and confirm the test user in Supabase Auth.');
  }
}

export async function captureEvidence({ env = process.env, fetchImpl = fetch, authenticate = signIn } = {}) {
  for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'BEACON_TEST_EMAIL', 'BEACON_TEST_PASSWORD']) {
    if (!env[key]) throw new Error(`Missing ${key}. Fill the ignored local configuration files first.`);
  }
  if (env.BEACON_DRAFT_CONFIRMED !== 'true') {
    throw new Error('Confirm the seeded draft exists, is unapproved, and belongs to the documented owner; then set BEACON_DRAFT_CONFIRMED=true locally.');
  }
  const site = new URL(env.BEACON_TEST_BASE_URL || 'https://cis3610-capstone-beacon.vercel.app');
  const db = new URL(env.SUPABASE_URL);
  if (site.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(site.hostname)) throw new Error('Use HTTPS for the deployed test site.');
  if (db.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(db.hostname)) throw new Error('Use HTTPS for Supabase.');
  const identity = await authenticate(env);
  if (!identity?.token || !identity.userId || identity.userId === owner) {
    throw new Error('The test account must be authenticated and must NOT be the seeded draft owner.');
  }
  const cases = [];
  async function run({ name, layer, path, method = 'GET', token = false, body, representation = false, check }) {
    const headers = {};
    const recordedHeaders = {};
    if (layer === 'supabase') {
      headers.apikey = env.SUPABASE_ANON_KEY;
      recordedHeaders.apikey = '${SUPABASE_ANON_KEY}';
    }
    if (token) {
      headers.Authorization = `Bearer ${identity.token}`;
      recordedHeaders.Authorization = 'Bearer ${OTHER_USER_ACCESS_TOKEN}';
    }
    if (body) { headers['Content-Type'] = 'application/json'; recordedHeaders['Content-Type'] = 'application/json'; }
    if (representation) { headers.Prefer = 'return=representation'; recordedHeaders.Prefer = 'return=representation'; }
    const response = await fetchImpl(new URL(path, layer === 'supabase' ? db : site), {
      method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
      redirect: 'error', // Do not forward credentials through an unexpected redirect.
    });
    const rawBody = await response.text();
    const json = parse(rawBody);
    const ok = check(response.status, json);
    const endpoint = layer === 'supabase' ? `\${SUPABASE_URL}${path}` : `${site.origin}${path}`;
    const curl = [`curl -i${method === 'GET' ? '' : ` -X ${method}`} "${endpoint}"`,
      ...Object.entries(recordedHeaders).map(([key, value]) => `  -H "${key}: ${value}"`),
      ...(body ? [`  --data '${JSON.stringify(body)}'`] : [])].join(' \\\n');
    cases.push({ name, layer, request: { method, path, headers: recordedHeaders,
      authorization_state: token ? 'Verified other-user access token; value redacted.' : 'Authorization header absent.',
      ...(body ? { body } : {}), curl },
      response: { status: response.status, status_text: response.statusText, body: rawBody }, passed: ok });
    return ok;
  }
  // A visible fixture is a positive control for valid project, key, and SELECT access.
  const control = await run({ name: 'Approved fixture positive control', layer: 'supabase',
    path: `/rest/v1/properties?select=id,owner_id,approved&id=eq.${approved}`,
    check: (status, rows) => status === 200 && Array.isArray(rows) && rows.length === 1 && rows[0].owner_id === owner && rows[0].approved === true });
  if (!control) throw new Error('The known approved fixture did not match. Confirm this is the correct development project and original seed.');
  await run({ name: 'Anonymous cannot read draft', layer: 'supabase',
    path: `/rest/v1/properties?select=id,title&id=eq.${draft}`,
    check: (status, rows) => status === 200 && Array.isArray(rows) && rows.length === 0 });
  await run({ name: 'Beacon rejects anonymous creation', layer: 'beacon', path: '/api/listings', method: 'POST', body: listing,
    check: (status, json) => status === 401 && json?.error === 'Authentication required.' });
  await run({ name: 'Other authenticated user can read approved listing', layer: 'supabase', token: true,
    path: `/rest/v1/properties?select=id,owner_id,approved&id=eq.${approved}`,
    check: (status, rows) => status === 200 && Array.isArray(rows) && rows.length === 1 && rows[0].approved === true });
  await run({ name: 'Other authenticated user cannot read draft', layer: 'supabase', token: true,
    path: `/rest/v1/properties?select=id,title&id=eq.${draft}`,
    check: (status, rows) => status === 200 && Array.isArray(rows) && rows.length === 0 });
  await run({ name: 'Other authenticated user cannot edit draft', layer: 'supabase', token: true, method: 'PATCH', representation: true,
    path: `/rest/v1/properties?id=eq.${draft}`, body: { title: 'Forbidden cross-owner edit' },
    check: (status, rows) => status === 200 && Array.isArray(rows) && rows.length === 0 });
  await run({ name: 'Other authenticated user cannot spoof owner on insert', layer: 'supabase', token: true, method: 'POST', representation: true,
    path: '/rest/v1/properties', body: { ...listing, owner_id: owner },
    check: (status, json) => status === 403 && json?.code === '42501' });
  await run({ name: 'Beacon rejects other-user edit', layer: 'beacon', token: true, method: 'PATCH',
    path: `/api/listings/${draft}`, body: { title: 'Forbidden cross-owner edit' },
    check: (status, json) => status === 404 && json?.error === 'Editable listing not found.' });
  const report = {
    generated_at_utc: new Date().toISOString(), target_table: 'public.properties', deployment: site.origin,
    credential_handling: 'Credentials and JWT values are replaced with placeholders; no service-role credential used.',
    identity_check: 'Supabase Auth verified the test user; UUID differs from seeded draft owner.',
    precondition: `Student confirmed draft ${draft} exists with approved=false and owner_id=${owner}. Confirm its title is unchanged after the run.`,
    fixture_owner_id: owner, fixture_draft_id: draft,
    limitations: 'This records anonymous and other-user HTTP tests. It does not execute live owner/admin operations or replace manual DDL/AI review.',
    all_passed: cases.every(item => item.passed), cases,
  };
  const secrets = [env.SUPABASE_ANON_KEY, env.SUPABASE_SERVICE_ROLE_KEY, env.BEACON_TEST_EMAIL, env.BEACON_TEST_PASSWORD, identity.token].filter(Boolean);
  function scrub(value) {
    if (typeof value === 'string') {
      for (const secret of secrets) {
        value = value.replaceAll(JSON.stringify(secret).slice(1, -1), '<REDACTED>').replaceAll(secret, '<REDACTED>');
      }
      return value;
    }
    if (Array.isArray(value)) return value.map(scrub);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrub(item)]));
    return value;
  }
  return scrub(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const report = await captureEvidence();
    const file = 'docs/lab-database/rls-live-evidence.json';
    await fs.writeFile(file, `${JSON.stringify(report, null, 2)}\n`);
    for (const item of report.cases) console.log(`${item.passed ? 'PASS' : 'FAIL'}: ${item.name} → HTTP ${item.response.status}`);
    console.log(`Redacted requests and raw response bodies saved to ${file}`);
    console.log('Confirm the draft still has its original title in Supabase Table Editor.');
    if (!report.all_passed) process.exitCode = 1;
  } catch (error) {
    // Known validation messages contain variable names only. Network/provider exceptions are not echoed.
    const safe = /^(Missing |Confirm the seeded|Sign-in failed|The test account|Use HTTPS|The known approved)/.test(error.message);
    console.error(safe ? error.message : 'Test could not complete. Check the local configuration, network, and test-user confirmation. No credentials were printed.');
    process.exitCode = 1;
  }
}
