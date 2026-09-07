import type { Express } from 'express';
import { restaurantQuerySchema } from './restaurants.schema';
import { listRestaurants } from './restaurants.service';

export function registerRestaurantRoutes(app: Express) {
  app.get('/v1/restaurants', async (req, res, next) => {
    try {
      const parsed = restaurantQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid restaurant query.' },
        });
      }

      const data = await listRestaurants(parsed.data);
      return res.json({ data });
    } catch (error) {
      return next(error);
    }
  });
}
