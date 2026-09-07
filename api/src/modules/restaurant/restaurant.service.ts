import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, menuItems, orders, restaurants, users } from '../../db/schema';
import type { CreateMenuItemInput, UpdateMenuItemInput } from './restaurant.schema';

export class RestaurantOperationError extends Error {}

async function getStaffRestaurantId(userId: string) {
  const [user] = await db.select({ restaurantId: users.restaurantId }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.restaurantId) throw new RestaurantOperationError('Your account is not assigned to a restaurant.');
  return user.restaurantId;
}

async function assertCategoryBelongsToRestaurant(categoryId: string, restaurantId: string) {
  const [category] = await db.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.restaurantId, restaurantId))).limit(1);
  if (!category) throw new RestaurantOperationError('Category not found for this restaurant.');
}

export async function listStaffMenu(userId: string) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [restaurant, items, categoryRows] = await Promise.all([
    db.select({ id: restaurants.id, name: restaurants.name, isOpen: restaurants.isOpen }).from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1),
    db.select({ id: menuItems.id, name: menuItems.name, description: menuItems.description, price: menuItems.price, imageUrl: menuItems.imageUrl, categoryId: menuItems.categoryId, isAvailable: menuItems.isAvailable })
      .from(menuItems).where(eq(menuItems.restaurantId, restaurantId)).orderBy(asc(menuItems.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.restaurantId, restaurantId)).orderBy(asc(categories.name)),
  ]);
  return { restaurant: restaurant[0] ?? null, items, categories: categoryRows };
}

export async function createMenuItem(userId: string, input: CreateMenuItemInput) {
  const restaurantId = await getStaffRestaurantId(userId);
  if (input.categoryId) await assertCategoryBelongsToRestaurant(input.categoryId, restaurantId);
  const [item] = await db.insert(menuItems).values({ restaurantId, name: input.name, description: input.description ?? null, price: input.price, categoryId: input.categoryId ?? null, imageUrl: input.imageUrl ?? null, isAvailable: input.isAvailable ?? true }).returning();
  return item;
}

export async function updateMenuItem(userId: string, menuItemId: string, input: UpdateMenuItemInput) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [existing] = await db.select({ id: menuItems.id }).from(menuItems).where(and(eq(menuItems.id, menuItemId), eq(menuItems.restaurantId, restaurantId))).limit(1);
  if (!existing) throw new RestaurantOperationError('Menu item not found.');
  if (input.categoryId) await assertCategoryBelongsToRestaurant(input.categoryId, restaurantId);
  const [item] = await db.update(menuItems).set(input).where(eq(menuItems.id, menuItemId)).returning();
  return item;
}

export async function setMenuItemAvailability(userId: string, menuItemId: string, isAvailable: boolean) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [item] = await db.update(menuItems).set({ isAvailable }).where(and(eq(menuItems.id, menuItemId), eq(menuItems.restaurantId, restaurantId))).returning();
  if (!item) throw new RestaurantOperationError('Menu item not found.');
  return item;
}

export async function createCategory(userId: string, name: string) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [category] = await db.insert(categories).values({ restaurantId, name }).returning();
  return category;
}

export async function updateCategory(userId: string, categoryId: string, name: string) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [category] = await db.update(categories).set({ name }).where(and(eq(categories.id, categoryId), eq(categories.restaurantId, restaurantId))).returning();
  if (!category) throw new RestaurantOperationError('Category not found.');
  return category;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [category] = await db.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.restaurantId, restaurantId))).returning({ id: categories.id });
  if (!category) throw new RestaurantOperationError('Category not found.');
}

export async function listStaffOrders(userId: string) {
  const restaurantId = await getStaffRestaurantId(userId);
  return db.select({ id: orders.id, status: orders.status, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus, deliveryAddress: orders.deliveryAddress, phone: orders.phone, total: orders.total, createdAt: orders.createdAt, customerName: users.fullName, customerEmail: users.email })
    .from(orders).innerJoin(users, eq(orders.userId, users.id)).where(eq(orders.restaurantId, restaurantId)).orderBy(desc(orders.createdAt)).limit(50);
}

export async function updateStaffOrderStatus(userId: string, orderId: string, nextStatus: string) {
  const restaurantId = await getStaffRestaurantId(userId);
  const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId))).limit(1);
  if (!order) throw new RestaurantOperationError('Order not found.');
  const allowed: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['ready'], ready: [], picked_up: [], delivered: [], cancelled: [] };
  if (!allowed[order.status]?.includes(nextStatus)) throw new RestaurantOperationError(`Order cannot move from ${order.status} to ${nextStatus}.`);
  const [updated] = await db.update(orders).set({ status: nextStatus, updatedAt: new Date() }).where(eq(orders.id, orderId)).returning({ id: orders.id, status: orders.status, updatedAt: orders.updatedAt });
  return updated;
}
