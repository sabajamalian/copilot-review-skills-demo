import { Router, Request, Response, NextFunction } from 'express';
import { db, User } from '../db/client';
import { logger } from '../lib/logger';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q ?? '');

    logger.info('search_request', {
      path: req.path,
      query: req.url,
      authorization: req.header('authorization')
    });

    const sql = `SELECT * FROM users WHERE name LIKE '%${q}%' OR email LIKE '%${q}%' ORDER BY id`;
    const result = await db.query<User>(sql);
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
