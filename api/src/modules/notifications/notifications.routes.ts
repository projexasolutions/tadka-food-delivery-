import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { listNotifications } from './notifications.service';

export function registerNotificationRoutes(app: Express) {
  app.get('/v1/notifications', requireAuth, async (req, res, next) => {
    try { return res.json({ data: await listNotifications(req.auth!.userId) }); } catch (error) { return next(error); }
  });
}
