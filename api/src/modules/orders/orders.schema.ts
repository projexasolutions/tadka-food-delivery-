import { z } from 'zod';

const phoneSchema = z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/).refine((value) => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}, { message: 'Phone number must contain 10 to 15 digits.' });

export const createOrderSchema = z.object({
  deliveryAddress: z.string().trim().min(10).max(500),
  phone: phoneSchema,
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
});

export const orderParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
