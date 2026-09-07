import { describe, expect, it } from 'vitest';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSessionId,
  readSessionId,
  setSessionCookie,
} from './auth.session';

describe('auth session helpers', () => {
  it('creates a high-entropy opaque session id', () => {
    const id = createSessionId();
    expect(id).toHaveLength(43);
    expect(createSessionId()).not.toBe(id);
  });

  it('round-trips the session cookie', () => {
    const id = createSessionId();
    const cookie = setSessionCookie(id);

    expect(cookie).toContain(`${SESSION_COOKIE}=${id}`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(readSessionId(cookie.split('; ').join('; '))).toBe(id);
  });

  it('clears the session cookie', () => {
    expect(clearSessionCookie()).toContain(`${SESSION_COOKIE}=; Max-Age=0`);
  });

  it('returns null when no session cookie exists', () => {
    expect(readSessionId('theme=dark; other=value')).toBeNull();
  });
});
