import type { Express } from 'express';
import { loginSchema, signupSchema } from './auth.schema';
import {
  AuthConflictError,
  InvalidCredentialsError,
  getSessionUser,
  login,
  revokeSession,
  signup,
} from './auth.service';
import { clearSessionCookie, readSessionId, setSessionCookie } from './auth.session';

function setCookie(res: Parameters<Express['get']>[1] extends never ? never : any, value: string) {
  res.setHeader('Set-Cookie', value);
}

export function registerAuthRoutes(app: Express) {
  app.post('/v1/auth/signup', async (req, res, next) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid signup details.' } });
      }

      const result = await signup(parsed.data);
      setCookie(res, setSessionCookie(result.sessionId));
      return res.status(201).json({ data: { user: result.user } });
    } catch (error) {
      if (error instanceof AuthConflictError) {
        return res.status(409).json({ error: { code: 'ACCOUNT_EXISTS', message: error.message } });
      }
      return next(error);
    }
  });

  app.post('/v1/auth/login', async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid login details.' } });
      }

      const result = await login(parsed.data);
      setCookie(res, setSessionCookie(result.sessionId));
      return res.json({ data: { user: result.user } });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: error.message } });
      }
      return next(error);
    }
  });

  app.get('/v1/auth/me', async (req, res, next) => {
    try {
      const sessionId = readSessionId(req.headers.cookie);
      if (!sessionId) {
        return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
      }

      const user = await getSessionUser(sessionId);
      if (!user) {
        return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
      }

      return res.json({ data: { user } });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/v1/auth/logout', async (req, res, next) => {
    try {
      const sessionId = readSessionId(req.headers.cookie);
      if (sessionId) await revokeSession(sessionId);
      setCookie(res, clearSessionCookie());
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });
}
