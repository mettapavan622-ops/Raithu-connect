import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createApiRouter } from './src/server/routes.ts';
import { runSeed } from './src/server/seed.ts';

dotenv.config();

export async function createApp() {
  const app = express();
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json());
  app.use(cookieParser());

  // Mount API router
  app.use('/api', createApiRouter());

  // In dev mode, attach Vite dev server middleware
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Start server if executed directly
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  // Ensure seed data is populated
  try {
    runSeed();
  } catch (err: any) {
    console.warn('Seed initialization error (ignorable if already seeded):', err.message);
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌾 RaithuConnect server running at http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
