import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : 'unknown_error';
  logger.error('request_failed', { path: req.path, method: req.method, message });
  res.status(500).json({ error: 'internal_server_error' });
}
