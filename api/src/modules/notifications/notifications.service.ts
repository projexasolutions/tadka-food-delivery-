import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { deliveries, orders, restaurants, users } from '../../db/schema';

export async function listNotifications(userId: string) {
  const [user] = await db.select({ role: users.role, restaurantId: users.restaurantId }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];
  if (user.role === 'rider') {
    const rows = await db.select({ id: deliveries.id, status: deliveries.status, orderId: orders.id, restaurantName: restaurants.name, createdAt: deliveries.assignedAt }).from(deliveries).innerJoin(orders, eq(deliveries.orderId, orders.id)).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id)).where(eq(deliveries.riderId, userId)).orderBy(desc(deliveries.assignedAt)).limit(25);
    return rows.map((row) => ({ id: `delivery:${row.id}:${row.status}`, type: 'delivery', title: `Delivery ${row.status.replace('_', ' ')}`, body: `Order #${row.orderId.slice(0, 8)} · ${row.restaurantName}`, createdAt: row.createdAt, read: false }));
  }
  if (user.role === 'restaurant_staff' && !user.restaurantId) return [];
  const scoped = user.role === 'customer' ? eq(orders.userId, userId) : user.role === 'admin' ? inArray(orders.status, ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']) : eq(orders.restaurantId, user.restaurantId!);
  const rows = await db.select({ id: orders.id, status: orders.status, total: orders.total, createdAt: orders.updatedAt, restaurantName: restaurants.name }).from(orders).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id)).where(scoped).orderBy(desc(orders.updatedAt)).limit(25);
  return rows.map((row) => ({ id: `order:${row.id}:${row.status}`, type: 'order', title: `Order ${row.status.replace('_', ' ')}`, body: `Order #${row.id.slice(0, 8)} · ${row.restaurantName} · ₹${row.total}`, createdAt: row.createdAt, read: false }));
}
