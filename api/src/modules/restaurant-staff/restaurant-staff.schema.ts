import { z } from 'zod';

const uuidParams = z.object({ id: z.string().uuid() });
export const itemIdParamsSchema = uuidParams;
export const orderIdParamsSchema = uuidParams;
export const categoryIdParamsSchema = uuidParams;

// Menu images are stored as compressed data URLs by the current restaurant UI.
// Keep a generous limit so portrait/vertical food photos can be saved as well.
const menuImageUrlSchema = z.string().max(900_000).refine(
  (value) => value.startsWith('data:image/') || z.string().url().safeParse(value).success,
  { message: 'Image must be a valid image data URL or URL.' },
).optional().nullable();

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.number().int().min(1).max(100000),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: menuImageUrlSchema,
  isAvailable: z.boolean().optional().default(true),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one menu item field is required.' });
export const createStaffCategorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const updateStaffCategorySchema = createStaffCategorySchema;
export const updateStaffRestaurantSchema = z.object({ isOpen: z.boolean() });
export const updateStaffOrderStatusSchema = z.object({ status: z.enum(['confirmed', 'preparing', 'ready', 'cancelled']) });

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateStaffCategoryInput = z.infer<typeof createStaffCategorySchema>;
export type UpdateStaffCategoryInput = z.infer<typeof updateStaffCategorySchema>;
export type UpdateStaffOrderStatusInput = z.infer<typeof updateStaffOrderStatusSchema>;
