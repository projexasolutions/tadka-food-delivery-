import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { deliveries, orders, restaurants, users } from '../../db/schema';
import type { AssignDeliveryInput, UpdateDeliveryStatusInput } from './delivery.schema';

export class DeliveryError extends Error {}
const transitions: Record<string, string[]> = { assigned: ['accepted'], accepted: ['picked_up'], picked_up: ['delivered'], delivered: [] };

export async function listRiders() {
  return db.select({ id: users.id, fullName: users.fullName, email: users.email }).from(users).where(eq(users.role, 'rider')).orderBy(asc(users.fullName), asc(users.email));
}

export async function assignDelivery(input: AssignDeliveryInput) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, input.orderId)).limit(1);
    if (!order) throw new DeliveryError('Order not found.');
    if (!['confirmed', 'preparing', 'ready'].includes(order.status)) throw new DeliveryError('Only active restaurant orders can be assigned.');
    const [rider] = await tx.select({ id: users.id }).from(users).where(and(eq(users.id, input.riderId), eq(users.role, 'rider'))).limit(1);
    if (!rider) throw new DeliveryError('Rider not found.');
    const [existing] = await tx.select({ id: deliveries.id, status: deliveries.status }).from(deliveries).where(eq(deliveries.orderId, input.orderId)).limit(1);
    if (existing && existing.status !== 'delivered') throw new DeliveryError('This order is already assigned to a rider.');
    if (existing) await tx.delete(deliveries).where(eq(deliveries.id, existing.id));
    const [delivery] = await tx.insert(deliveries).values({ orderId: input.orderId, riderId: input.riderId, status: 'assigned' }).returning({ id: deliveries.id });
    return delivery;
  });
}

export async function listRiderDeliveries(riderId: string) {
  return db.select({ id: deliveries.id, orderId: orders.id, status: deliveries.status, assignedAt: deliveries.assignedAt, pickedUpAt: deliveries.pickedUpAt, deliveredAt: deliveries.deliveredAt, address: orders.deliveryAddress, phone: orders.phone, total: orders.total, orderStatus: orders.status, restaurantName: restaurants.name })
    .from(deliveries).innerJoin(orders, eq(deliveries.orderId, orders.id)).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(eq(deliveries.riderId, riderId)).orderBy(asc(deliveries.status), asc(deliveries.assignedAt));
}

export async function updateDeliveryStatus(riderId: string, deliveryId: string, input: UpdateDeliveryStatusInput) {
  return db.transaction(async (tx) => {
    const [delivery] = await tx.select({ id: deliveries.id, orderId: deliveries.orderId, status: deliveries.status }).from(deliveries).where(and(eq(deliveries.id, deliveryId), eq(deliveries.riderId, riderId))).limit(1);
    if (!delivery) throw new DeliveryError('Delivery not found.');
    if (!transitions[delivery.status]?.includes(input.status)) throw new DeliveryError(`Cannot move delivery from ${delivery.status} to ${input.status}.`);
    const now = new Date();
    if (input.status === 'accepted') await tx.update(deliveries).set({ status: 'accepted', updatedAt: now }).where(and(eq(deliveries.id, delivery.id), eq(deliveries.status, 'assigned')));
    if (input.status === 'picked_up') {
      await tx.update(deliveries).set({ status: 'picked_up', pickedUpAt: now, updatedAt: now }).where(and(eq(deliveries.id, delivery.id), eq(deliveries.status, 'accepted')));
      await tx.update(orders).set({ status: 'picked_up', updatedAt: now }).where(and(eq(orders.id, delivery.orderId), eq(orders.status, 'ready')));
    }
    if (input.status === 'delivered') {
      await tx.update(deliveries).set({ status: 'delivered', deliveredAt: now, updatedAt: now }).where(and(eq(deliveries.id, delivery.id), eq(deliveries.status, 'picked_up')));
      await tx.update(orders).set({ status: 'delivered', updatedAt: now }).where(and(eq(orders.id, delivery.orderId), eq(orders.status, 'picked_up')));
    }
    return { id: delivery.id, orderId: delivery.orderId, status: input.status };
  });
}
