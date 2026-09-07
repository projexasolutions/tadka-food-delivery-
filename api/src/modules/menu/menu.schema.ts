import { z } from 'zod';

export const restaurantIdParamsSchema = z.object({
  restaurantId: z.string().uuid(),
});

export type RestaurantIdParams = z.infer<typeof restaurantIdParamsSchema>;
