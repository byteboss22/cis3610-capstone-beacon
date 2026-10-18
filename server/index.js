import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createDatabase } from './database.js';
try {
  const server = createServer(createApp({ database: createDatabase() }));
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
    console.log('Beacon development server started on loopback.');
  });
} catch {
  console.error('Startup failed. Check server-only environment configuration.');
  process.exitCode = 1;
}
