import { randomBytes } from 'node:crypto';

export const SESSION_COOKIE = 'tadka_session';
const DEFAULT_SESSION_DAYS = 30;

export function createSessionId() {
  return randomBytes(32).toString('base64url');
}

export function sessionTtlMs() {
  const configuredDays = Number(process.env.SESSION_TTL_DAYS ?? DEFAULT_SESSION_DAYS);
  const days = Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : DEFAULT_SESSION_DAYS;
  return days * 24 * 60 * 60 * 1000;
}

function cookieSecurityAttributes() {
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ];
}

export function setSessionCookie(sessionId: string) {
  return `${SESSION_COOKIE}=${sessionId}; Max-Age=${Math.floor(sessionTtlMs() / 1000)}; ${cookieSecurityAttributes().join('; ')}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Max-Age=0; ${cookieSecurityAttributes().join('; ')}`;
}

export function readSessionId(cookieHeader?: string) {
  if (!cookieHeader) return null;

  const sessionCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  return sessionCookie ? sessionCookie.slice(SESSION_COOKIE.length + 1) || null : null;
}
