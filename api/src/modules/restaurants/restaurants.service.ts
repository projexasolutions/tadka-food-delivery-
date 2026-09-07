import { and, asc, eq, gte, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client';
import { restaurants } from '../../db/schema';
import type { z } from 'zod';
import type { restaurantQuerySchema } from './restaurants.schema';

type RestaurantQuery = z.infer<typeof restaurantQuerySchema>;

export async function listRestaurants(query: RestaurantQuery) {
  const search = query.q ? `%${query.q}%` : null;
  const cuisine = query.cuisine ? `%${query.cuisine}%` : null;
  const conditions = [eq(restaurants.isOpen, true)];

  if (search) {
    conditions.push(
      or(
        ilike(restaurants.name, search),
        ilike(restaurants.cuisine, search),
        ilike(restaurants.description, search),
      )!,
    );
  }

  if (cuisine) conditions.push(ilike(restaurants.cuisine, cuisine));
  if (query.filter === 'rating') conditions.push(gte(restaurants.rating, '4.0'));
  if (query.filter === 'offers') conditions.push(eq(restaurants.deliveryFee, 0));

  // A delivery-time field is not present in the current model, so the API does not
  // incorrectly derive speed from delivery price.
  return db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      description: restaurants.description,
      cuisine: restaurants.cuisine,
      rating: restaurants.rating,
      deliveryFee: restaurants.deliveryFee,
      imageUrl: restaurants.imageUrl,
      isOpen: restaurants.isOpen,
    })
    .from(restaurants)
    .where(and(...conditions))
    .orderBy(asc(restaurants.name));
}
