import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { orders, reviews, users } from '../../db/schema';
import type { CreateReviewInput } from './reviews.schema';

export class ReviewError extends Error {}

export async function createReview(userId: string, orderId: string, input: CreateReviewInput) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ id: orders.id, restaurantId: orders.restaurantId, status: orders.status }).from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
    if (!order) throw new ReviewError('Order not found.');
    if (order.status !== 'delivered') throw new ReviewError('You can review an order after it has been delivered.');
    const [existing] = await tx.select({ id: reviews.id }).from(reviews).where(eq(reviews.orderId, orderId)).limit(1);
    if (existing) throw new ReviewError('This order has already been reviewed.');
    try {
      const [review] = await tx.insert(reviews).values({ orderId, userId, restaurantId: order.restaurantId, rating: input.rating, comment: input.comment || null }).returning();
      if (!review) throw new ReviewError('Unable to create review.');
      return review;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ReviewError('This order has already been reviewed.');
      throw error;
    }
  });
}

export async function listRestaurantReviews(restaurantId: string) {
  return db.select({ id: reviews.id, orderId: reviews.orderId, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, customerName: users.fullName })
    .from(reviews).innerJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.restaurantId, restaurantId)).orderBy(desc(reviews.createdAt));
}

export async function listMyReviews(userId: string) {
  return db.select({ id: reviews.id, orderId: reviews.orderId, restaurantId: reviews.restaurantId, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt })
    .from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt));
}

function isUniqueViolation(error: unknown): error is { code: string } { return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505'; }
