import { z } from 'zod';

export const deliveryIdParamsSchema = z.object({ deliveryId: z.string().uuid() });
export const assignDeliverySchema = z.object({ orderId: z.string().uuid(), riderId: z.string().uuid() });
export const updateDeliveryStatusSchema = z.object({ status: z.enum(['accepted', 'picked_up', 'delivered']) });

export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
