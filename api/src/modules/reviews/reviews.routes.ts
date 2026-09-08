import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { createReviewSchema, orderIdParamsSchema, restaurantIdParamsSchema } from './reviews.schema';
import { createReview, listMyReviews, listRestaurantReviews, ReviewError } from './reviews.service';

export function registerReviewRoutes(app: Express) {
  app.get('/v1/reviews/me', requireAuth, async (req, res, next) => {
    try { return res.json({ data: await listMyReviews(req.auth!.userId) }); } catch (error) { return next(error); }
  });

  app.get('/v1/restaurants/:restaurantId/reviews', async (req, res, next) => {
    try {
      const parsed = restaurantIdParamsSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid restaurant id.' } });
      return res.json({ data: await listRestaurantReviews(parsed.data.restaurantId) });
    } catch (error) { return next(error); }
  });

  app.post('/v1/orders/:orderId/review', requireAuth, async (req, res, next) => {
    try {
      const params = orderIdParamsSchema.safeParse(req.params);
      const body = createReviewSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid review details.' } });
      return res.status(201).json({ data: await createReview(req.auth!.userId, params.data.orderId, body.data) });
    } catch (error) {
      if (error instanceof ReviewError) return res.status(409).json({ error: { code: 'REVIEW_ERROR', message: error.message } });
      return next(error);
    }
  });
}
