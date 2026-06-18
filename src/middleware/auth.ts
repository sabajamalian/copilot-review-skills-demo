import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  userId?: number;
}

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = header.slice('bearer '.length).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' && typeof payload.sub !== 'number') {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
