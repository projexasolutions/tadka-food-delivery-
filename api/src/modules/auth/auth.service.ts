import argon2 from 'argon2';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../../db/client';
import { sessions, users } from '../../db/schema';
import { createSessionId, sessionTtlMs } from './auth.session';
import type { LoginInput, SignupInput, UpdateProfileInput } from './auth.schema';

const INVALID_CREDENTIALS = 'Invalid email or password.';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signup(input: SignupInput) {
  const email = normalizeEmail(input.email);
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({ email, passwordHash, fullName: input.fullName.trim() }).returning({ id: users.id, email: users.email, fullName: users.fullName, role: users.role });
      if (!user) throw new Error('User creation returned no row.');
      const sessionId = createSessionId();
      const expiresAt = new Date(Date.now() + sessionTtlMs());
      const [session] = await tx.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt }).returning({ id: sessions.id });
      if (!session) throw new Error('Session creation returned no row.');
      return { user, sessionId: session.id };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AuthConflictError();
    throw error;
  }
}

export async function login(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user?.passwordHash) throw new InvalidCredentialsError();
  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw new InvalidCredentialsError();
  const session = await createSession(user.id);
  return { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, sessionId: session.id };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const [user] = await db.update(users).set({ fullName: input.fullName.trim() }).where(eq(users.id, userId)).returning({ id: users.id, email: users.email, fullName: users.fullName, role: users.role });
  if (!user) throw new Error('User not found.');
  return user;
}

export async function createSession(userId: string) {
  const id = createSessionId();
  const expiresAt = new Date(Date.now() + sessionTtlMs());
  const [session] = await db.insert(sessions).values({ id, userId, expiresAt }).returning();
  if (!session) throw new Error('Session creation returned no row.');
  return session;
}

export async function getSessionUser(sessionId: string) {
  const now = new Date();
  const [result] = await db.select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now))).limit(1);
  return result ?? null;
}

export async function revokeSession(sessionId: string) { await db.delete(sessions).where(eq(sessions.id, sessionId)); }

export class InvalidCredentialsError extends Error { constructor() { super(INVALID_CREDENTIALS); this.name = 'InvalidCredentialsError'; } }
export class AuthConflictError extends Error { constructor() { super('Unable to create this account.'); this.name = 'AuthConflictError'; } }
function isUniqueViolation(error: unknown): error is { code: string } { return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505'; }
