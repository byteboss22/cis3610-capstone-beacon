import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../server/app.js';

const owner = '11111111-1111-4111-8111-111111111111';
const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const fields = { title: 'Demo', description: 'Fictional', city: 'Sample', rent_cents: 100 };
async function fixture(t, overrides = {}) {
  const calls = [];
  const database = {
    verifyUser: async token => token === 'valid-test-token' ? { id: owner, app_metadata: {}, user_metadata: { role: 'admin' } } : null,
    listings: async () => ({ data: [], error: null }),
    sponsors: async () => ({ data: [], error: null }),
    listing: async () => ({ data: { id, ...fields } }),
    createListing: async (...args) => { calls.push(['create', ...args]); return { data: { id, ...fields } }; },
    updateDraft: async (...args) => { calls.push(['update', ...args]); return { data: { id, ...fields } }; },
    approveListing: async (...args) => { calls.push(['admin', ...args]); return { data: { id, approved: true } }; },
    ...overrides,
  };
  const server = createServer(createApp({ database }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return {
    calls,
    request: (path, method = 'GET', value, token = 'valid-test-token', headers = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(value !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(value !== undefined ? { body: typeof value === 'string' ? value : JSON.stringify(value) } : {}),
    }),
  };
}
test('public GET succeeds without authentication; API handler does not serve repository files', async t => {
  const { request } = await fixture(t);
  const response = await request('/api/listings', 'GET', undefined, null);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { listings: [] });
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  for (const path of ['/.env.local', '/server/database.js', '/supabase/seed.sql']) assert.equal((await request(path)).status, 404);
  assert.equal((await request('/')).status, 404);
});
test('POST uses verified identity and PATCH passes validated draft fields', async t => {
  const { request, calls } = await fixture(t);
  assert.equal((await request('/api/listings', 'POST', fields)).status, 201);
  assert.deepEqual(calls[0], ['create', 'valid-test-token', owner, fields]);
  assert.equal((await request(`/api/listings/${id}`, 'PATCH', { title: ' Revised ' })).status, 200);
  assert.deepEqual(calls[1], ['update', 'valid-test-token', owner, id, { title: 'Revised' }]);
});
test('unauthenticated and invalid tokens cannot write', async t => {
  const { request, calls } = await fixture(t);
  for (const token of [null, 'invalid']) assert.equal((await request('/api/listings', 'POST', fields, token)).status, 401);
  assert.equal(calls.length, 0);
});
test('strict validation blocks ownership spoofing, self-approval, invalid values and malformed input', async t => {
  const { request, calls } = await fixture(t);
  for (const value of [{ ...fields, owner_id: owner }, { ...fields, approved: true }, { ...fields, rent_cents: -1 }, { ...fields, rent_cents: 1.2 }, { ...fields, title: ' ' }, { ...fields, city: 'x'.repeat(101) }, '{']) {
    assert.equal((await request('/api/listings', 'POST', value)).status, 400);
  }
  assert.equal((await request(`/api/listings/${id}`, 'PATCH', {})).status, 400);
  assert.equal((await request('/api/listings/not-a-uuid', 'PATCH', { title: 'x' })).status, 400);
  assert.equal((await request('/api/listings', 'POST', fields, 'valid-test-token', { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request('/api/listings', 'POST', { ...fields, description: 'x'.repeat(17000) })).status, 413);
  assert.equal(calls.length, 0);
});
test('uneditable or nonexistent drafts return the same 404', async t => {
  const { request } = await fixture(t, { updateDraft: async () => ({ data: null }) });
  const response = await request(`/api/listings/${id}`, 'PATCH', { title: 'Attack' });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Editable listing not found.' });
});
test('administrator authorization ignores client-editable user_metadata', async t => {
  const { request, calls } = await fixture(t);
  assert.equal((await request(`/api/admin/listings/${id}`, 'PATCH', { approved: true })).status, 403);
  assert.equal(calls.length, 0);
});
test('verified administrator can approve through dedicated route', async t => {
  const { request, calls } = await fixture(t, { verifyUser: async () => ({ id: owner, app_metadata: { role: 'admin' } }) });
  assert.equal((await request(`/api/admin/listings/${id}`, 'PATCH', { approved: true })).status, 200);
  assert.deepEqual(calls[0], ['admin', id, true]);
  assert.equal((await request(`/api/admin/listings/${id}`, 'PATCH', { approved: true, owner_id: owner })).status, 400);
});
test('upstream errors and thrown exceptions never expose details', async t => {
  const { request } = await fixture(t, {
    listings: async () => ({ error: { message: 'private database detail' } }),
    createListing: async () => { throw new Error('private configuration detail'); },
  });
  for (const response of [await request('/api/listings'), await request('/api/listings', 'POST', fields)]) {
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private/);
  }
});

test('public detail and sponsors routes use safe projections and hide unavailable listings', async t => {
  const { request } = await fixture(t);
  assert.equal((await request(`/api/listings/${id}`, 'GET', undefined, null)).status, 200);
  assert.deepEqual(await (await request('/api/sponsors', 'GET', undefined, null)).json(), { sponsors: [] });
  const hidden = await fixture(t, { listing: async () => ({ data: null }) });
  assert.equal((await hidden.request(`/api/listings/${id}`)).status, 404);
  assert.equal((await request('/api/listings/not-a-uuid')).status, 400);
});
test('presentation inputs are validated without widening ownership or approval permissions', async t => {
  const { request, calls } = await fixture(t);
  const display = { bedrooms: 2, bathrooms: 1.5, property_type: 'apartment', image_url: '/properties/brookhaven-apartment.svg' };
  assert.equal((await request(`/api/listings/${id}`, 'PATCH', display)).status, 200);
  assert.deepEqual(calls[0].at(-1), display);
  for (const fields of [{ bathrooms: 1.25 }, { bedrooms: -1 }, { image_url: 'https://example.invalid/image.svg' }, { state: 'California' }, { amenities: ['invalid'] }, { property_type: 'castle' }, { ...display, approved: true }]) {
    assert.equal((await request(`/api/listings/${id}`, 'PATCH', fields)).status, 400);
  }
});
