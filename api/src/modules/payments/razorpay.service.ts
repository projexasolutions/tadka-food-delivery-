import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { orders } from '../../db/schema';
import type { CreateRazorpayOrderInput, VerifyRazorpayPaymentInput } from './razorpay.schema';

const RAZORPAY_API = 'https://api.razorpay.com/v1/orders';

export class PaymentError extends Error {}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new PaymentError(`${name} is not configured.`);
  return value;
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export async function createRazorpayOrder(userId: string, input: CreateRazorpayOrderInput) {
  const rows = await db.select({
    id: orders.id,
    total: orders.total,
    paymentMethod: orders.paymentMethod,
    paymentStatus: orders.paymentStatus,
    razorpayOrderId: orders.razorpayOrderId,
  }).from(orders).where(eq(orders.id, input.orderId)).limit(1);

  const order = rows[0];
  if (!order || (await db.select({ id: orders.id }).from(orders).where(eq(orders.id, input.orderId)).limit(1))[0]?.id !== input.orderId) {
    throw new PaymentError('Order not found.');
  }

  const owned = await db.select({ id: orders.id }).from(orders)
    .where(eq(orders.id, input.orderId)).limit(1);
  if (!owned[0]) throw new PaymentError('Order not found.');

  if (order.paymentMethod !== 'online') throw new PaymentError('This order does not require online payment.');
  if (order.paymentStatus === 'paid') throw new PaymentError('This order has already been paid.');
  if (order.razorpayOrderId) return { razorpayOrderId: order.razorpayOrderId, amount: order.total * 100, currency: 'INR' };

  const keyId = requiredEnv('RAZORPAY_KEY_ID');
  const keySecret = requiredEnv('RAZORPAY_KEY_SECRET');
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch(RAZORPAY_API, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: order.total * 100, currency: 'INR', receipt: order.id }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.id) {
    throw new PaymentError('Unable to create the payment order.');
  }

  await db.update(orders).set({ razorpayOrderId: body.id, updatedAt: new Date() }).where(eq(orders.id, order.id));
  return { razorpayOrderId: body.id, amount: body.amount, currency: body.currency };
}

export async function verifyRazorpayPayment(userId: string, input: VerifyRazorpayPaymentInput) {
  const rows = await db.select({ id: orders.id, razorpayOrderId: orders.razorpayOrderId, paymentStatus: orders.paymentStatus })
    .from(orders).where(eq(orders.id, input.orderId)).limit(1);
  const order = rows[0];
  if (!order) throw new PaymentError('Order not found.');
  if (order.paymentStatus === 'paid') return { paid: true };
  if (order.razorpayOrderId !== input.razorpayOrderId) throw new PaymentError('Payment order mismatch.');

  const expected = sign(`${input.razorpayOrderId}|${input.razorpayPaymentId}`, requiredEnv('RAZORPAY_KEY_SECRET'));
  const valid = timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(input.razorpaySignature, 'utf8'));
  if (!valid) throw new PaymentError('Invalid payment signature.');

  await db.update(orders).set({ paymentStatus: 'paid', razorpayPaymentId: input.razorpayPaymentId, updatedAt: new Date() }).where(eq(orders.id, input.orderId));
  return { paid: true };
}

export async function handleRazorpayWebhook(rawBody: Buffer, signature: string) {
  const expected = sign(rawBody.toString('utf8'), requiredEnv('RAZORPAY_WEBHOOK_SECRET'));
  const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) throw new PaymentError('Invalid webhook signature.');

  const payload = JSON.parse(rawBody.toString('utf8')) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  const payment = payload.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  if (!razorpayOrderId) return;

  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    await db.update(orders).set({ paymentStatus: 'paid', razorpayPaymentId: payment?.id, updatedAt: new Date() }).where(eq(orders.razorpayOrderId, razorpayOrderId));
  } else if (payload.event === 'payment.failed') {
    await db.update(orders).set({ paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.razorpayOrderId, razorpayOrderId));
  }
}
