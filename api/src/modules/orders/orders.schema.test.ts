import { describe, expect, it } from 'vitest';
import { createOrderSchema } from './orders.schema';

describe('createOrderSchema', () => {
  const base = {
    deliveryAddress: '123 Main Street, Nagpur',
    paymentMethod: 'cod' as const,
  };

  it('accepts common Indian phone formats', () => {
    expect(createOrderSchema.safeParse({ ...base, phone: '9876543210' }).success).toBe(true);
    expect(createOrderSchema.safeParse({ ...base, phone: '+91 98765 43210' }).success).toBe(true);
  });

  it('rejects values that have too few digits despite formatting characters', () => {
    expect(createOrderSchema.safeParse({ ...base, phone: '(111111111)' }).success).toBe(false);
  });
});
