import type { Express } from 'express';
import { restaurantIdParamsSchema } from './menu.schema';
import { getRestaurantMenu } from './menu.service';

export function registerMenuRoutes(app: Express) {
  app.get('/v1/restaurants/:restaurantId/menu', async (req, res, next) => {
    try {
      const parsed = restaurantIdParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid restaurant id.' },
        });
      }

      const data = await getRestaurantMenu(parsed.data.restaurantId);
      if (!data.restaurant) {
        return res.status(404).json({
          error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found.' },
        });
      }

      return res.json({ data });
    } catch (error) {
      return next(error);
    }
  });
}
