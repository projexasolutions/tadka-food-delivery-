import { z } from 'zod';

export const menuItemIdParamsSchema = z.object({ menuItemId: z.string().uuid() });
export const orderIdParamsSchema = z.object({ orderId: z.string().uuid() });
export const categoryIdParamsSchema = z.object({ categoryId: z.string().uuid() });

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().int().min(1).max(100000),
  categoryId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createCategorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const updateCategorySchema = createCategorySchema;

export const restaurantOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'ready', 'cancelled']),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
