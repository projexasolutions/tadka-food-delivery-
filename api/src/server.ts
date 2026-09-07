import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { registerRestaurantRoutes } from './modules/restaurants/restaurants.routes';
import { registerMenuRoutes } from './modules/menu/menu.routes';
import { pool } from './db/client';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res, next) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok', service: 'tadka-api', database: 'ok' });
  } catch (error) {
    next(error);
  }
});

registerRestaurantRoutes(app);
registerMenuRoutes(app);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});

const server = app.listen(port, () => {
  console.log(`Tadka API listening on :${port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
