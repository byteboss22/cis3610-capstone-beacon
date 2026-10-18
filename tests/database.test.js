import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createDatabase, LISTING_COLUMNS } from '../server/database.js';

test('Supabase HTTP adapter preserves caller tokens, selected columns and ownership filters', async t => {
  const requests = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({ url: new URL(req.url, 'http://localhost'), method: req.method, auth: req.headers.authorization, body: chunks.length ? JSON.parse(Buffer.concat(chunks)) : null });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(req.url.startsWith('/auth/') ? { id: 'verified-user', app_metadata: {} } : []));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const db = createDatabase({ SUPABASE_URL: `http://127.0.0.1:${server.address().port}`, SUPABASE_ANON_KEY: 'test-anon', SUPABASE_SERVICE_ROLE_KEY: 'test-service' });
  assert.equal((await db.verifyUser('caller-token')).id, 'verified-user');
  assert.equal(requests[0].url.pathname, '/auth/v1/user');
  assert.equal(requests[0].auth, 'Bearer caller-token');
  await db.listings();
  assert.equal(requests[1].url.searchParams.get('select'), LISTING_COLUMNS);
  assert.equal(requests[1].url.searchParams.get('approved'), 'eq.true');
  assert.equal(requests[1].url.searchParams.get('limit'), '100');
  await db.updateDraft('caller-token', 'verified-user', 'listing-id', { title: "Quoted ' title" });
  const update = requests[2];
  assert.equal(update.auth, 'Bearer caller-token');
  assert.equal(update.url.searchParams.get('owner_id'), 'eq.verified-user');
  assert.equal(update.url.searchParams.get('approved'), 'eq.false');
  assert.equal(update.url.searchParams.get('id'), 'eq.listing-id');
  assert.deepEqual(update.body, { title: "Quoted ' title" });
  await db.createListing('caller-token', 'verified-user', { title: 'Demo' });
  assert.equal(requests[3].url.pathname, '/rest/v1/profiles');
  assert.equal(requests[4].body.owner_id, 'verified-user');
  assert.equal(requests[4].auth, 'Bearer caller-token');
  await db.approveListing('listing-id', true);
  assert.equal(requests[5].auth, 'Bearer test-service');
  assert.deepEqual(requests[5].body, { approved: true });
});
