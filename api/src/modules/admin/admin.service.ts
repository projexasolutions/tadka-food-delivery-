import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { orders, restaurants, users } from '../../db/schema';
import type { UpdateOrderStatusInput, UpdateRestaurantInput, UpdateUserRoleInput } from './admin.schema';

export class AdminError extends Error {}

const allowedTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['picked_up', 'cancelled'],
  picked_up: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function getDashboard() {
  const [userCount, restaurantCount, orderCount, paidRevenue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(restaurants),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(eq(orders.paymentStatus, 'paid')),
  ]);

  return {
    users: Number(userCount[0]?.count ?? 0),
    restaurants: Number(restaurantCount[0]?.count ?? 0),
    orders: Number(orderCount[0]?.count ?? 0),
    paidRevenue: Number(paidRevenue[0]?.total ?? 0),
  };
}

export async function listUsers() {
  return db
    .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function updateUserRole(adminUserId: string, userId: string, input: UpdateUserRoleInput) {
  if (adminUserId === userId && input.role !== 'admin') {
    throw new AdminError('You cannot remove your own admin access.');
  }

  const [updated] = await db
    .update(users)
    .set({ role: input.role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, fullName: users.fullName, role: users.role });

  if (!updated) throw new AdminError('User not found.');
  return updated;
}

export async function listRestaurants() {
  return db
    .select({ id: restaurants.id, name: restaurants.name, cuisine: restaurants.cuisine, rating: restaurants.rating, isOpen: restaurants.isOpen, createdAt: restaurants.createdAt })
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt));
}

export async function updateRestaurant(restaurantId: string, input: UpdateRestaurantInput) {
  const [updated] = await db
    .update(restaurants)
    .set({ isOpen: input.isOpen })
    .where(eq(restaurants.id, restaurantId))
    .returning({ id: restaurants.id, name: restaurants.name, isOpen: restaurants.isOpen });

  if (!updated) throw new AdminError('Restaurant not found.');
  return updated;
}

export async function listRecentOrders() {
  return db
    .select({
      id: orders.id,
      restaurantId: orders.restaurantId,
      restaurantName: restaurants.name,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .orderBy(desc(orders.createdAt))
    .limit(25);
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
  const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new AdminError('Order not found.');

  if (!allowedTransitions[order.status]?.includes(input.status)) {
    throw new AdminError(`Cannot move an order from ${order.status} to ${input.status}.`);
  }

  const [updated] = await db
    .update(orders)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning({ id: orders.id, status: orders.status, updatedAt: orders.updatedAt });

  return updated;
}
