import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { createOrderSchema, orderParamsSchema } from './orders.schema';
import { createOrder, getOrder, listOrders, OrderError } from './orders.service';

export function registerOrderRoutes(app: Express) {
  app.post('/v1/orders', requireAuth, async (req, res, next) => {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid checkout details.' } });
      return res.status(201).json({ data: await createOrder(req.auth!.userId, parsed.data) });
    } catch (error) {
      if (error instanceof OrderError) return res.status(409).json({ error: { code: 'ORDER_NOT_READY', message: error.message } });
      return next(error);
    }
  });

  app.get('/v1/orders', requireAuth, async (req, res, next) => {
    try { return res.json({ data: await listOrders(req.auth!.userId) }); }
    catch (error) { return next(error); }
  });

  app.get('/v1/orders/:orderId', requireAuth, async (req, res, next) => {
    try {
      const parsed = orderParamsSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid order ID.' } });
      const order = await getOrder(req.auth!.userId, parsed.data.orderId);
      if (!order) return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' } });
      return res.json({ data: order });
    } catch (error) { return next(error); }
  });
}
