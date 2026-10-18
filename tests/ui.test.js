import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
function page(t, fetch) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost' });
  t.after(() => dom.window.close());
  dom.window.fetch = fetch;
  dom.window.AbortSignal = AbortSignal;
  dom.window.eval(script);
  return dom.window.document;
}
test('UI announces loading then empty and clears busy state', async t => {
  let resolve;
  const doc = page(t, () => new Promise(done => { resolve = done; }));
  assert.match(doc.querySelector('#status').textContent, /Loading/);
  assert.equal(doc.querySelector('#listings').getAttribute('aria-busy'), 'true');
  resolve({ ok: true, json: async () => ({ listings: [] }) });
  await settle();
  assert.match(doc.querySelector('#status').textContent, /No approved listings/);
  assert.equal(doc.querySelector('#listings').getAttribute('aria-busy'), 'false');
});
test('UI handles failure and retry, rendering database content as text', async t => {
  let count = 0;
  const title = '<img src=x onerror=alert(1)>';
  const doc = page(t, async () => {
    count++;
    if (count === 1) return { ok: false };
    return { ok: true, json: async () => ({ listings: [{ title, city: 'Sample', description: 'Fictional', rent_cents: 180000 }] }) };
  });
  await settle();
  assert.match(doc.querySelector('#status').textContent, /could not be loaded/);
  assert.equal(doc.querySelector('#retry').hidden, false);
  doc.querySelector('#retry').click();
  await settle();
  assert.equal(doc.querySelector('h2').textContent, title);
  assert.equal(doc.querySelector('article img'), null);
  assert.match(doc.querySelector('strong').textContent, /1,800/);
  assert.equal(doc.querySelector('#retry').hidden, true);
});
