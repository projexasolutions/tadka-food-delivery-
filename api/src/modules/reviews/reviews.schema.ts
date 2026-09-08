import { z } from 'zod';

export const orderIdParamsSchema = z.object({ orderId: z.string().uuid() });
export const restaurantIdParamsSchema = z.object({ restaurantId: z.string().uuid() });
export const createReviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional().nullable() });
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
