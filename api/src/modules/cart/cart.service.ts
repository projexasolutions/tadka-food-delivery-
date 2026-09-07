import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { carts, cartItems, menuItems } from '../../db/schema';
import type { AddCartItemInput, UpdateCartItemInput } from './cart.schema';

export class CartItemError extends Error {}

async function getOrCreateCart(userId: string) {
  const existing = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId)).limit(1);
  if (existing[0]) return existing[0].id;

  const created = await db.insert(carts).values({ userId }).returning({ id: carts.id });
  return created[0].id;
}

export async function getCart(userId: string) {
  const cart = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart[0]) return { id: null, items: [] };

  const items = await db
    .select({
      id: cartItems.id,
      menuItemId: cartItems.menuItemId,
      quantity: cartItems.quantity,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      imageUrl: menuItems.imageUrl,
      restaurantId: menuItems.restaurantId,
    })
    .from(cartItems)
    .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
    .where(eq(cartItems.cartId, cart[0].id));

  return { id: cart[0].id, items };
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const menuItem = await db
    .select({ id: menuItems.id, isAvailable: menuItems.isAvailable })
    .from(menuItems)
    .where(eq(menuItems.id, input.menuItemId))
    .limit(1);

  if (!menuItem[0] || !menuItem[0].isAvailable) throw new CartItemError('This dish is currently unavailable.');

  const cartId = await getOrCreateCart(userId);
  const existing = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.menuItemId, input.menuItemId)))
    .limit(1);

  const quantity = Math.min((existing[0]?.quantity ?? 0) + input.quantity, 50);

  if (existing[0]) {
    await db.update(cartItems).set({ quantity, updatedAt: new Date() }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ cartId, menuItemId: input.menuItemId, quantity });
  }

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  return getCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, input: UpdateCartItemInput) {
  const cart = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart[0]) throw new CartItemError('Cart item not found.');

  const item = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart[0].id)))
    .limit(1);
  if (!item[0]) throw new CartItemError('Cart item not found.');

  if (input.quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await db.update(cartItems).set({ quantity: input.quantity, updatedAt: new Date() }).where(eq(cartItems.id, itemId));
  }
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart[0].id));
  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  return updateCartItem(userId, itemId, { quantity: 0 });
}
