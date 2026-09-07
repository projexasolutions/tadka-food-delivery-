import { z } from 'zod';

export const restaurantQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  cuisine: z.string().trim().max(60).optional(),
  filter: z.enum(['all', 'veg', 'rating', 'fast', 'offers']).default('all'),
});
