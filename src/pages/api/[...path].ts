import type { NextApiRequest, NextApiResponse } from 'next';
import { createApp } from '../../../server/app.js';
import { createDatabase } from '../../../server/database.js';

// Next Pages API files are server-only bundles. Preserve the already-tested streaming validation and authorization code.
export const config = { api: { bodyParser: false } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await createApp({ database: createDatabase() })(req, res);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
}
