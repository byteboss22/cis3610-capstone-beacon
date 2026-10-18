import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const fields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  city: z.string().trim().min(1).max(100),
  rent_cents: z.number().int().min(0).max(100000000),
};
const listing = z.strictObject(fields);
const patch = listing.partial().refine(value => Object.keys(value).length > 0);
const approval = z.strictObject({ approved: z.boolean() });
const uuid = z.uuid();
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function body(req, schema) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, 'Use application/json.');
  }
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 16384) throw new HttpError(413, 'Request too large.');
    chunks.push(chunk);
  }
  let value;
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'Invalid JSON.'); }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new HttpError(400, 'Invalid request fields.');
  return parsed.data;
}
function result(value) {
  if (value.error) throw new HttpError(503, 'Database request unavailable.');
  return value.data;
}
export function createApp({ database }) {
  return async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const json = (status, value) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(value));
    };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && assets.has(path)) {
        const [file, mime] = assets.get(path);
        const content = await readFile(new URL(`../public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': mime }); res.end(content); return;
      }
      if (path === '/api/listings' && req.method === 'GET') {
        json(200, { listings: result(await database.listings()) }); return;
      }
      const edit = path.match(/^\/api\/listings\/([^/]+)$/);
      const admin = path.match(/^\/api\/admin\/listings\/([^/]+)$/);
      if ((path === '/api/listings' && req.method === 'POST') || ((edit || admin) && req.method === 'PATCH')) {
        const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
        if (!token) throw new HttpError(401, 'Authentication required.');
        const user = await database.verifyUser(token);
        if (!user) throw new HttpError(401, 'Authentication required.');
        if (admin && user.app_metadata?.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
        const id = (edit || admin)?.[1];
        if (id && !uuid.safeParse(id).success) throw new HttpError(400, 'Invalid listing ID.');
        if (admin) {
          const fields = await body(req, approval);
          const data = result(await database.approveListing(id, fields.approved));
          if (!data) throw new HttpError(404, 'Listing not found.');
          json(200, { listing: data }); return;
        }
        const fields = await body(req, edit ? patch : listing);
        const data = result(await (edit
          ? database.updateDraft(token, user.id, id, fields)
          : database.createListing(token, user.id, fields)));
        if (!data) throw new HttpError(404, 'Editable listing not found.');
        json(edit ? 200 : 201, { listing: data }); return;
      }
      json(404, { error: 'Route not found.' });
    } catch (error) {
      // Do not echo database errors, tokens, request bodies, or configuration.
      json(error instanceof HttpError ? error.status : 503,
        { error: error instanceof HttpError ? error.message : 'Service temporarily unavailable.' });
    }
  };
}
