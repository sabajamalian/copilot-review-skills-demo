import { Router, Request, Response, NextFunction } from 'express';
import { db, Order } from '../db/client';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const result = await db.query<Order>(
      'SELECT * FROM orders ORDER BY id LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ orders: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
});

router.get('/by-user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: 'invalid_user_id' });
      return;
    }
    const result = await db.query<Order>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY id',
      [userId]
    );
    res.json({ orders: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
