import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { carts, cartItems, menuItems, orderItems, orders, restaurants } from '../../db/schema';
import type { CreateOrderInput } from './orders.schema';

export class OrderError extends Error {}

export async function createOrder(userId: string, input: CreateOrderInput) {
  return db.transaction(async (tx) => {
    const cart = await tx.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart[0]) throw new OrderError('Your cart is empty.');

    const items = await tx.select({
      id: cartItems.id,
      menuItemId: menuItems.id,
      quantity: cartItems.quantity,
      name: menuItems.name,
      price: menuItems.price,
      restaurantId: menuItems.restaurantId,
      isAvailable: menuItems.isAvailable,
      deliveryFee: restaurants.deliveryFee,
      restaurantOpen: restaurants.isOpen,
    }).from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .innerJoin(restaurants, eq(menuItems.restaurantId, restaurants.id))
      .where(eq(cartItems.cartId, cart[0].id));

    if (!items.length) throw new OrderError('Your cart is empty.');
    const restaurantId = items[0].restaurantId;
    if (items.some((item) => item.restaurantId !== restaurantId)) throw new OrderError('Your cart contains items from multiple restaurants.');
    if (!items.every((item) => item.isAvailable)) throw new OrderError('One or more dishes are no longer available.');
    if (!items.every((item) => item.restaurantOpen)) throw new OrderError('This restaurant is currently closed.');

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = items[0].deliveryFee;
    const total = subtotal + deliveryFee;

    const [order] = await tx.insert(orders).values({
      userId,
      restaurantId,
      deliveryAddress: input.deliveryAddress,
      phone: input.phone,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      subtotal,
      deliveryFee,
      total,
    }).returning({ id: orders.id });

    await tx.insert(orderItems).values(items.map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
    })));

    // COD is final at checkout, so its cart can be cleared immediately.
    // Online payment keeps the cart until server-side payment verification succeeds.
    if (input.paymentMethod === 'cod') {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));
      await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart[0].id));
    }
    return getOrderForUser(userId, order.id, tx);
  });
}

async function getOrderForUser(userId: string, orderId: string, executor = db) {
  const rows = await executor.select({
    id: orders.id, status: orders.status, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus,
    deliveryAddress: orders.deliveryAddress, phone: orders.phone, subtotal: orders.subtotal, deliveryFee: orders.deliveryFee,
    total: orders.total, createdAt: orders.createdAt, restaurantId: restaurants.id, restaurantName: restaurants.name,
  }).from(orders).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);

  if (!rows[0]) return null;
  const items = await executor.select({
    id: orderItems.id, menuItemId: orderItems.menuItemId, name: orderItems.name,
    price: orderItems.price, quantity: orderItems.quantity, lineTotal: orderItems.lineTotal,
  }).from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...rows[0], items };
}

export async function listOrders(userId: string) {
  const rows = await db.select({
    id: orders.id, status: orders.status, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus,
    deliveryAddress: orders.deliveryAddress, phone: orders.phone, subtotal: orders.subtotal, deliveryFee: orders.deliveryFee,
    total: orders.total, createdAt: orders.createdAt, restaurantName: restaurants.name,
  }).from(orders).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));

  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const items = await db.select({
    id: orderItems.id, orderId: orderItems.orderId, name: orderItems.name,
    price: orderItems.price, quantity: orderItems.quantity, lineTotal: orderItems.lineTotal,
  }).from(orderItems).where(inArray(orderItems.orderId, ids));
  const byOrder = new Map<string, typeof items>();
  for (const item of items) byOrder.set(item.orderId, [...(byOrder.get(item.orderId) ?? []), item]);
  return rows.map((row) => ({ ...row, items: byOrder.get(row.id) ?? [] }));
}

export async function getOrder(userId: string, orderId: string) {
  return getOrderForUser(userId, orderId);
}
