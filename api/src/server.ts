import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerRestaurantRoutes } from './modules/restaurants/restaurants.routes';
import { registerMenuRoutes } from './modules/menu/menu.routes';
import { registerCartRoutes } from './modules/cart/cart.routes';
import { registerOrderRoutes } from './modules/orders/orders.routes';
import { registerRazorpayRoutes } from './modules/payments/razorpay.routes';
import { registerAdminRoutes } from './modules/admin/admin.routes';
import { registerRestaurantStaffRoutes } from './modules/restaurant-staff/restaurant-staff.routes';
import { registerDeliveryRoutes } from './modules/delivery/delivery.routes';
import { registerReviewRoutes } from './modules/reviews/reviews.routes';
import { registerNotificationRoutes } from './modules/notifications/notifications.routes';
import { handleRazorpayWebhook, PaymentError } from './modules/payments/razorpay.service';
import { pool } from './db/client';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const allowedOrigins = process.env.WEB_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins : process.env.NODE_ENV === 'production' ? false : true;

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true');
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));

app.post('/v1/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  try {
    const signature = req.get('x-razorpay-signature');
    if (!signature || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: { code: 'INVALID_WEBHOOK', message: 'Invalid webhook request.' } });
    await handleRazorpayWebhook(req.body, signature);
    return res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof PaymentError) return res.status(400).json({ error: { code: 'INVALID_WEBHOOK', message: error.message } });
    return next(error);
  }
});

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  if (allowedOrigins.length === 0 || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('Origin');
  if (!origin || allowedOrigins.includes(origin)) return next();
  return res.status(403).json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Request origin is not allowed.' } });
});

app.get('/health', async (_req, res, next) => {
  try { await pool.query('select 1'); res.json({ status: 'ok', service: 'tadka-api', database: 'ok' }); } catch (error) { next(error); }
});

registerAuthRoutes(app);
registerRestaurantRoutes(app);
registerMenuRoutes(app);
registerCartRoutes(app);
registerOrderRoutes(app);
registerRazorpayRoutes(app);
registerRestaurantStaffRoutes(app);
registerAdminRoutes(app);
registerDeliveryRoutes(app);
registerReviewRoutes(app);
registerNotificationRoutes(app);

app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } }); });

const server = app.listen(port, () => console.log(`Tadka API listening on :${port}`));
async function shutdown(signal: string) { console.log(`${signal} received; shutting down.`); server.close(async () => { await pool.end(); process.exit(0); }); }
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
