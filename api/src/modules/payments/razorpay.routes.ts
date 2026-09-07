import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema } from './razorpay.schema';
import { createRazorpayOrder, handleRazorpayWebhook, PaymentError, verifyRazorpayPayment } from './razorpay.service';

export function registerRazorpayRoutes(app: Express) {
  app.post('/v1/payments/razorpay/order', requireAuth, async (req, res, next) => {
    try {
      const parsed = createRazorpayOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payment order request.' } });
      return res.status(201).json({ data: await createRazorpayOrder(req.auth!.userId, parsed.data) });
    } catch (error) {
      if (error instanceof PaymentError) return res.status(409).json({ error: { code: 'PAYMENT_ERROR', message: error.message } });
      return next(error);
    }
  });

  app.post('/v1/payments/razorpay/verify', requireAuth, async (req, res, next) => {
    try {
      const parsed = verifyRazorpayPaymentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payment verification request.' } });
      return res.json({ data: await verifyRazorpayPayment(req.auth!.userId, parsed.data) });
    } catch (error) {
      if (error instanceof PaymentError) return res.status(400).json({ error: { code: 'PAYMENT_ERROR', message: error.message } });
      return next(error);
    }
  });

  app.post('/v1/payments/razorpay/webhook', async (req, res, next) => {
    try {
      const signature = req.get('x-razorpay-signature');
      if (!signature || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: { code: 'INVALID_WEBHOOK', message: 'Invalid webhook request.' } });
      await handleRazorpayWebhook(req.body, signature);
      return res.status(200).json({ received: true });
    } catch (error) {
      if (error instanceof PaymentError) return res.status(400).json({ error: { code: 'INVALID_WEBHOOK', message: error.message } });
      return next(error);
    }
  });
}
