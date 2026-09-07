import { z } from 'zod';

export const createOrderSchema = z.object({
  deliveryAddress: z.string().trim().min(10).max(500),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
});

export const orderParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
