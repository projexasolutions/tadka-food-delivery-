import { and, eq, inArray, sql } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '../../db/client';
import { carts, cartItems, orderItems, orders } from '../../db/schema';
import type { CreateRazorpayOrderInput, VerifyRazorpayPaymentInput } from './razorpay.schema';

const RAZORPAY_API = 'https://api.razorpay.com/v1/orders';
export class PaymentError extends Error {}
function requiredEnv(name: string) { const value = process.env[name]; if (!value) throw new PaymentError('Payment service is not configured.'); return value; }
function sign(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('hex'); }

async function clearPaidOrderCart(orderId: string, userId: string) {
  const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart) return;
  const rows = await db.select({ cartItemId: orderItems.cartItemId }).from(orderItems).where(eq(orderItems.orderId, orderId));
  const ids = rows.map((row) => row.cartItemId).filter((id): id is string => Boolean(id));
  if (ids.length) await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), inArray(cartItems.id, ids)));
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
}

export async function createRazorpayOrder(userId: string, input: CreateRazorpayOrderInput) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`payment:${input.orderId}`}))`);
    const [order] = await tx.select({ id: orders.id, total: orders.total, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus, razorpayOrderId: orders.razorpayOrderId })
      .from(orders).where(and(eq(orders.id, input.orderId), eq(orders.userId, userId))).limit(1);
    if (!order) throw new PaymentError('Order not found.');
    if (order.paymentMethod !== 'online') throw new PaymentError('This order does not require online payment.');
    if (order.paymentStatus === 'paid') throw new PaymentError('This order has already been paid.');
    if (order.razorpayOrderId) return { razorpayOrderId: order.razorpayOrderId, amount: order.total * 100, currency: 'INR' };

    const keyId = requiredEnv('RAZORPAY_KEY_ID'); const keySecret = requiredEnv('RAZORPAY_KEY_SECRET'); const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(RAZORPAY_API, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: order.total * 100, currency: 'INR', receipt: order.id }) });
    const body = await response.json().catch(() => null); if (!response.ok || !body?.id) throw new PaymentError('Unable to create the payment order.');
    await tx.update(orders).set({ razorpayOrderId: body.id, updatedAt: new Date() }).where(eq(orders.id, order.id));
    return { razorpayOrderId: body.id, amount: body.amount, currency: body.currency };
  });
}

export async function verifyRazorpayPayment(userId: string, input: VerifyRazorpayPaymentInput) {
  const [order] = await db.select({ id: orders.id, razorpayOrderId: orders.razorpayOrderId, paymentStatus: orders.paymentStatus }).from(orders).where(and(eq(orders.id, input.orderId), eq(orders.userId, userId))).limit(1);
  if (!order) throw new PaymentError('Order not found.'); if (order.paymentStatus === 'paid') return { paid: true }; if (order.razorpayOrderId !== input.razorpayOrderId) throw new PaymentError('Payment order mismatch.');
  const expected = sign(`${input.razorpayOrderId}|${input.razorpayPaymentId}`, requiredEnv('RAZORPAY_KEY_SECRET')); const supplied = Buffer.from(input.razorpaySignature, 'utf8');
  const valid = supplied.length === expected.length && timingSafeEqual(Buffer.from(expected, 'utf8'), supplied); if (!valid) throw new PaymentError('Invalid payment signature.');
  const [updated] = await db.update(orders).set({ paymentStatus: 'paid', razorpayPaymentId: input.razorpayPaymentId, updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, 'pending'))).returning({ id: orders.id });
  if (updated) await clearPaidOrderCart(order.id, userId);
  return { paid: true };
}

export async function handleRazorpayWebhook(rawBody: Buffer, signature: string) {
  const expected = sign(rawBody.toString('utf8'), requiredEnv('RAZORPAY_WEBHOOK_SECRET')); const supplied = Buffer.from(signature, 'utf8');
  const valid = supplied.length === expected.length && timingSafeEqual(Buffer.from(expected, 'utf8'), supplied); if (!valid) throw new PaymentError('Invalid webhook signature.');
  let payload: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try { payload = JSON.parse(rawBody.toString('utf8')); } catch { throw new PaymentError('Invalid webhook payload.'); }
  const payment = payload.payload?.payment?.entity; const razorpayOrderId = payment?.order_id; if (!razorpayOrderId) return;
  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const [order] = await db.update(orders).set({ paymentStatus: 'paid', razorpayPaymentId: payment?.id, updatedAt: new Date() }).where(and(eq(orders.razorpayOrderId, razorpayOrderId), eq(orders.paymentStatus, 'pending'))).returning({ id: orders.id, userId: orders.userId });
    if (order) await clearPaidOrderCart(order.id, order.userId);
  } else if (payload.event === 'payment.failed') {
    await db.update(orders).set({ paymentStatus: 'failed', updatedAt: new Date() }).where(and(eq(orders.razorpayOrderId, razorpayOrderId), eq(orders.paymentStatus, 'pending')));
  }
}
