import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureEvidence } from '../scripts/capture-rls-evidence.mjs';

const env = {
  SUPABASE_URL: 'https://fixture.example.invalid', SUPABASE_ANON_KEY: 'fictional-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'unused-fictional-service-key',
  BEACON_TEST_EMAIL: 'other@example.invalid', BEACON_TEST_PASSWORD: 'fictional-password-with-"quote',
  BEACON_DRAFT_CONFIRMED: 'true', BEACON_TEST_BASE_URL: 'https://beacon.example.invalid',
};
const token = 'fictional-user-access-token';
const identity = { userId: '22222222-2222-4222-8222-222222222222', token };
function provider({ allowForbidden = false } = {}) {
  const calls = [];
  return { calls, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    const isDb = url.hostname === 'fixture.example.invalid';
    if (isDb) {
      assert.equal(options.headers.apikey, env.SUPABASE_ANON_KEY);
      if (options.headers.Authorization) assert.equal(options.headers.Authorization, `Bearer ${token}`);
    } else assert.equal(options.headers.apikey, undefined);
    assert.equal(options.redirect, 'error');
    let body; let status = 200;
    if (url.searchParams.get('id')?.includes('aaaaaaaa')) body = [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', owner_id: '11111111-1111-4111-8111-111111111111', approved: true }];
    else if (!isDb && options.method === 'POST') { status = 401; body = { error: 'Authentication required.' }; }
    else if (!isDb) { status = 404; body = { error: 'Editable listing not found.' }; }
    else if (options.method === 'POST') { status = 403; body = { code: '42501', message: 'new row violates row-level security policy for table "properties"', hint: env.BEACON_TEST_PASSWORD }; }
    else if (allowForbidden && options.method === 'PATCH') body = [{ id: 'unexpected-edit' }];
    else body = [];
    return new Response(JSON.stringify(body), { status });
  } };
}
test('live evidence capture records exact role requests and redacts credentials', async () => {
  const api = provider();
  const report = await captureEvidence({ env, fetchImpl: api.fetchImpl, authenticate: async () => identity });
  assert.equal(report.all_passed, true);
  assert.equal(report.cases.length, 8);
  assert.equal(api.calls[0].options.headers.Authorization, undefined);
  assert.equal(api.calls[1].options.headers.Authorization, undefined);
  assert.equal(api.calls[2].options.headers.Authorization, undefined);
  assert.ok(api.calls.slice(3).every(call => call.options.headers.Authorization === `Bearer ${token}`));
  assert.equal(report.cases[5].request.body.title, 'Forbidden cross-owner edit');
  assert.equal(report.cases[5].request.headers.Prefer, 'return=representation');
  assert.match(report.cases[6].request.curl, /Authorization: Bearer \$\{OTHER_USER_ACCESS_TOKEN\}/);
  assert.equal(report.cases[6].response.status, 403);
  assert.equal(JSON.parse(report.cases[6].response.body).code, '42501');
  const output = JSON.stringify(report);
  for (const secret of [env.SUPABASE_ANON_KEY, env.SUPABASE_SERVICE_ROLE_KEY, env.BEACON_TEST_EMAIL, env.BEACON_TEST_PASSWORD, token]) assert.ok(!output.includes(JSON.stringify(secret).slice(1, -1)));
});
test('capture requires confirmed fixture and non-owner identity before making probe requests', async () => {
  let requests = 0;
  const fetchImpl = async () => { requests++; throw new Error('Unexpected request'); };
  await assert.rejects(captureEvidence({ env: { ...env, BEACON_DRAFT_CONFIRMED: 'false' }, fetchImpl }), /Confirm the seeded/);
  await assert.rejects(captureEvidence({ env, fetchImpl, authenticate: async () => ({ ...identity, userId: '11111111-1111-4111-8111-111111111111' }) }), /must NOT/);
  assert.equal(requests, 0);
});
test('capture preserves unexpected successful writes as failures rather than passing evidence', async () => {
  const report = await captureEvidence({ env, fetchImpl: provider({ allowForbidden: true }).fetchImpl, authenticate: async () => identity });
  assert.equal(report.all_passed, false);
  assert.equal(report.cases[5].passed, false);
  assert.equal(report.cases[5].response.body, '[{"id":"unexpected-edit"}]');
});
