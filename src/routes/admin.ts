import { Router, Request, Response, NextFunction } from 'express';
import { db, User } from '../db/client';
import { parseRange, summarizeUser, AdminAction } from '../lib/adminUtils';

const router = Router();

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = parseRange(req.query.range);
    if (!range.ok) {
      res.status(400).json({ error: 'invalid_range' });
      return;
    }
    const result = await db.query<User>(
      'SELECT * FROM users WHERE id BETWEEN $1 AND $2 ORDER BY id',
      [range.from, range.to]
    );
    res.json({
      users: result.rows.map(summarizeUser),
      count: result.rowCount,
      range: { from: range.from, to: range.to },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/actions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'invalid_id' });
      return;
    }
    const action = req.body?.action as AdminAction | undefined;
    switch (action) {
      case 'suspend':
        await db.query('UPDATE users SET status = $1 WHERE id = $2', ['suspended', id]);
        res.status(202).json({ id, action });
        return;
      case 'reactivate':
        await db.query('UPDATE users SET status = $1 WHERE id = $2', ['active', id]);
        res.status(202).json({ id, action });
        return;
      case 'delete':
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).end();
        return;
      default:
        res.status(400).json({ error: 'unknown_action' });
        return;
    }
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    const orders = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM orders');
    const total = Number(users.rows[0]?.count ?? 0) + Number(orders.rows[0]?.count ?? 0);
    if (total < 0) {
      res.status(500).json({ error: 'invalid_stats' });
      return;
    }
    res.json({
      users: Number(users.rows[0]?.count ?? 0),
      orders: Number(orders.rows[0]?.count ?? 0),
      total,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
