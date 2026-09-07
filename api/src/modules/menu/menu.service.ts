import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { categories, menuItems, restaurants } from '../../db/schema';

export async function getRestaurantMenu(restaurantId: string) {
  const [restaurant] = await db.select({ id: restaurants.id, name: restaurants.name, description: restaurants.description, cuisine: restaurants.cuisine, rating: restaurants.rating, deliveryFee: restaurants.deliveryFee, imageUrl: restaurants.imageUrl })
    .from(restaurants).where(and(eq(restaurants.id, restaurantId), eq(restaurants.isOpen, true))).limit(1);
  if (!restaurant) return { restaurant: null, items: [], categories: [] };

  const [items, restaurantCategories] = await Promise.all([
    db.select({ id: menuItems.id, name: menuItems.name, description: menuItems.description, price: menuItems.price, imageUrl: menuItems.imageUrl, categoryId: menuItems.categoryId })
      .from(menuItems).where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.isAvailable, true))).orderBy(asc(menuItems.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.restaurantId, restaurantId)).orderBy(asc(categories.name)),
  ]);
  return { restaurant, items, categories: restaurantCategories };
}
