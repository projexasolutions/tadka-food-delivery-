import { z } from 'zod';

export const userIdParamsSchema = z.object({ userId: z.string().uuid() });
export const restaurantIdParamsSchema = z.object({ restaurantId: z.string().uuid() });
export const orderIdParamsSchema = z.object({ orderId: z.string().uuid() });
export const categoryIdParamsSchema = z.object({ categoryId: z.string().uuid() });
export const updateUserRoleSchema = z.object({
  role: z.enum(['customer', 'restaurant_staff', 'rider', 'admin']),
  restaurantId: z.string().uuid().nullable().optional(),
});
export const createRestaurantSchema = z.object({ name: z.string().trim().min(2).max(120), cuisine: z.string().trim().max(80).optional().nullable(), description: z.string().trim().max(500).optional().nullable(), deliveryFee: z.coerce.number().int().min(0).max(100000).default(0) });
export const updateRestaurantSchema = z.object({ isOpen: z.boolean() });
export const updateOrderStatusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']) });
export const createCategorySchema = z.object({ restaurantId: z.string().uuid(), name: z.string().trim().min(2).max(80) });

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
