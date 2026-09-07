import { describe, expect, it } from 'vitest';

function requireRole(...roles: string[]) {
  return (role: string | undefined) => Boolean(role && roles.includes(role));
}

describe('role authorization policy', () => {
  it('allows an explicitly permitted role', () => {
    expect(requireRole('admin')('admin')).toBe(true);
  });

  it('rejects an unpermitted role', () => {
    expect(requireRole('admin')('customer')).toBe(false);
    expect(requireRole('restaurant_staff')('rider')).toBe(false);
  });

  it('does not treat a missing role as authorized', () => {
    expect(requireRole('admin')(undefined)).toBe(false);
  });
});
