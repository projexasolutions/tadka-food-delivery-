import { z } from 'zod';

export const addCartItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(50),
});

export const cartItemParamsSchema = z.object({
  itemId: z.string().uuid(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
