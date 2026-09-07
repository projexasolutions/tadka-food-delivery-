import { z } from 'zod';

export const userIdParamsSchema = z.object({ userId: z.string().uuid() });
export const restaurantIdParamsSchema = z.object({ restaurantId: z.string().uuid() });
export const orderIdParamsSchema = z.object({ orderId: z.string().uuid() });
export const categoryIdParamsSchema = z.object({ categoryId: z.string().uuid() });

export const updateUserRoleSchema = z.object({ role: z.enum(['customer', 'restaurant_staff', 'rider', 'admin']) });
export const updateRestaurantSchema = z.object({ isOpen: z.boolean() });
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']),
});
export const createCategorySchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
