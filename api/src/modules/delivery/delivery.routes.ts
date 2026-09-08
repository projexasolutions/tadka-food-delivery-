import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { requireRole } from '../auth/auth.roles';
import { assignDeliverySchema, deliveryIdParamsSchema, updateDeliveryStatusSchema } from './delivery.schema';
import { assignDelivery, DeliveryError, listAllDeliveries, listRiderDeliveries, listRiders, updateDeliveryStatus } from './delivery.service';

const adminOnly = [requireAuth, requireRole('admin')];
const riderOnly = [requireAuth, requireRole('rider')];

export function registerDeliveryRoutes(app: Express) {
  app.get('/v1/admin/riders', ...adminOnly, async (_req, res, next) => { try { return res.json({ data: await listRiders() }); } catch (error) { return next(error); } });
  app.get('/v1/admin/deliveries', ...adminOnly, async (_req, res, next) => { try { return res.json({ data: await listAllDeliveries() }); } catch (error) { return next(error); } });
  app.post('/v1/admin/deliveries', ...adminOnly, async (req, res, next) => { try { const body = assignDeliverySchema.safeParse(req.body); if (!body.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid delivery request.' } }); return res.status(201).json({ data: await assignDelivery(body.data) }); } catch (error) { if (error instanceof DeliveryError) return res.status(409).json({ error: { code: 'DELIVERY_OPERATION_FAILED', message: error.message } }); return next(error); } });
  app.get('/v1/rider/deliveries', ...riderOnly, async (req, res, next) => { try { return res.json({ data: await listRiderDeliveries(req.auth!.userId) }); } catch (error) { return next(error); } });
  app.patch('/v1/rider/deliveries/:deliveryId/status', ...riderOnly, async (req, res, next) => { try { const params = deliveryIdParamsSchema.safeParse(req.params); const body = updateDeliveryStatusSchema.safeParse(req.body); if (!params.success || !body.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid delivery status.' } }); return res.json({ data: await updateDeliveryStatus(req.auth!.userId, params.data.deliveryId, body.data) }); } catch (error) { if (error instanceof DeliveryError) return res.status(409).json({ error: { code: 'DELIVERY_OPERATION_FAILED', message: error.message } }); return next(error); } });
}
