import type { NextFunction, Request, Response } from 'express';
import { getSessionUser } from './auth.service';
import { readSessionId } from './auth.session';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: string;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = readSessionId(req.headers.cookie);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    }

    req.auth = { userId: user.id, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}
