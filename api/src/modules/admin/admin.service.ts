import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, orders, restaurants, users } from '../../db/schema';
import type { CreateCategoryInput, UpdateOrderStatusInput, UpdateRestaurantInput, UpdateUserRoleInput } from './admin.schema';

export class AdminError extends Error {}

const allowedTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'],
  ready: ['picked_up', 'cancelled'], picked_up: ['delivered'], delivered: [], cancelled: [],
};

export async function getDashboard() {
  const [userCount, restaurantCount, orderCount, paidRevenue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users), db.select({ count: sql<number>`count(*)` }).from(restaurants),
    db.select({ count: sql<number>`count(*)` }).from(orders), db.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(eq(orders.paymentStatus, 'paid')),
  ]);
  return { users: Number(userCount[0]?.count ?? 0), restaurants: Number(restaurantCount[0]?.count ?? 0), orders: Number(orderCount[0]?.count ?? 0), paidRevenue: Number(paidRevenue[0]?.total ?? 0) };
}

export async function listUsers() {
  return db.select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, restaurantId: users.restaurantId, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(adminUserId: string, userId: string, input: UpdateUserRoleInput) {
  if (adminUserId === userId && input.role !== 'admin') throw new AdminError('You cannot remove your own admin access.');
  if (input.role === 'restaurant_staff' && !input.restaurantId) throw new AdminError('A restaurant is required for restaurant staff.');
  const [updated] = await db.update(users).set({ role: input.role, restaurantId: input.role === 'restaurant_staff' ? input.restaurantId : null })
    .where(eq(users.id, userId)).returning({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, restaurantId: users.restaurantId });
  if (!updated) throw new AdminError('User not found.');
  return updated;
}

export async function listRestaurants() {
  return db.select({ id: restaurants.id, name: restaurants.name, cuisine: restaurants.cuisine, rating: restaurants.rating, isOpen: restaurants.isOpen, createdAt: restaurants.createdAt }).from(restaurants).orderBy(desc(restaurants.createdAt));
}

export async function updateRestaurant(restaurantId: string, input: UpdateRestaurantInput) {
  const [updated] = await db.update(restaurants).set({ isOpen: input.isOpen }).where(eq(restaurants.id, restaurantId)).returning({ id: restaurants.id, name: restaurants.name, isOpen: restaurants.isOpen });
  if (!updated) throw new AdminError('Restaurant not found.');
  return updated;
}

export async function listRecentOrders() {
  return db.select({ id: orders.id, restaurantId: orders.restaurantId, restaurantName: restaurants.name, status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total, createdAt: orders.createdAt })
    .from(orders).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id)).orderBy(desc(orders.createdAt)).limit(25);
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
  const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new AdminError('Order not found.');
  if (!allowedTransitions[order.status]?.includes(input.status)) throw new AdminError(`Cannot move an order from ${order.status} to ${input.status}.`);
  const [updated] = await db.update(orders).set({ status: input.status, updatedAt: new Date() }).where(eq(orders.id, orderId)).returning({ id: orders.id, status: orders.status, updatedAt: orders.updatedAt });
  return updated;
}

export async function listCategories() {
  return db.select({ id: categories.id, restaurantId: categories.restaurantId, restaurantName: restaurants.name, name: categories.name, createdAt: categories.createdAt })
    .from(categories).leftJoin(restaurants, eq(categories.restaurantId, restaurants.id)).orderBy(desc(categories.createdAt));
}

export async function createCategory(input: CreateCategoryInput) {
  const [restaurant] = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.id, input.restaurantId)).limit(1);
  if (!restaurant) throw new AdminError('Restaurant not found.');
  const [category] = await db.insert(categories).values(input).returning({ id: categories.id, restaurantId: categories.restaurantId, name: categories.name });
  return category;
}

export async function deleteCategory(categoryId: string) {
  const [deleted] = await db.delete(categories).where(eq(categories.id, categoryId)).returning({ id: categories.id });
  if (!deleted) throw new AdminError('Category not found.');
}
