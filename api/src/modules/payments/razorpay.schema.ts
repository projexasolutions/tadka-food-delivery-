import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  orderId: z.string().uuid(),
});

export const verifyRazorpayPaymentSchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().min(1).max(100),
  razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>;
export type VerifyRazorpayPaymentInput = z.infer<typeof verifyRazorpayPaymentSchema>;
