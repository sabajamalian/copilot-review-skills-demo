import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db/client';

describe('orders routes', () => {
  const app = createApp();

  beforeEach(() => {
    db.seed();
  });

  it('GET /orders returns paginated orders', async () => {
    const res = await request(app).get('/orders?limit=2&offset=0');
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.offset).toBe(0);
  });

  it("GET /orders/by-user/:userId returns only that user's orders", async () => {
    const res = await request(app).get('/orders/by-user/1');
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);
    for (const o of res.body.orders) {
      expect(o.user_id).toBe(1);
    }
  });

  it('GET /orders/by-user/:userId returns 400 for invalid id', async () => {
    const res = await request(app).get('/orders/by-user/0');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_user_id' });
  });

  it('GET /orders/by-user/:userId returns empty list when user has none', async () => {
    const res = await request(app).get('/orders/by-user/9999');
    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });
});
