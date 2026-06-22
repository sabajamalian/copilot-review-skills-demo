import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db/client';

const app = createApp();

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('GET /admin/users', () => {
  it('returns 400 for an invalid range', async () => {
    const res = await request(app).get('/admin/users?range=abc');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_range' });
  });

  it('returns 200 with default range when no query param', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.range).toEqual({ from: 1, to: 1000 });
    expect(res.body.users).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns 200 with the requested range', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await request(app).get('/admin/users?range=1-10');
    expect(res.status).toBe(200);
    expect(res.body.range).toEqual({ from: 1, to: 10 });
  });

  it('forwards db errors to the error handler', async () => {
    jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).get('/admin/users?range=1-10');
    expect(res.status).toBe(500);
  });
});

describe('POST /admin/users/:id/actions', () => {
  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app)
      .post('/admin/users/abc/actions')
      .send({ action: 'suspend' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_id' });
  });

  it('returns 400 for id = 0', async () => {
    const res = await request(app)
      .post('/admin/users/0/actions')
      .send({ action: 'suspend' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_id' });
  });

  it('suspends a user and returns 202', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const res = await request(app)
      .post('/admin/users/1/actions')
      .send({ action: 'suspend' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ id: 1, action: 'suspend' });
  });

  it('reactivates a user and returns 202', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const res = await request(app)
      .post('/admin/users/1/actions')
      .send({ action: 'reactivate' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ id: 1, action: 'reactivate' });
  });

  it('deletes a user and returns 204', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const res = await request(app)
      .post('/admin/users/1/actions')
      .send({ action: 'delete' });
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('returns 400 for an unknown action', async () => {
    const res = await request(app)
      .post('/admin/users/1/actions')
      .send({ action: 'ban' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'unknown_action' });
  });

  it('returns 400 when action field is missing', async () => {
    const res = await request(app)
      .post('/admin/users/1/actions')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'unknown_action' });
  });
});

describe('GET /admin/stats', () => {
  it('returns 200 with correct aggregated totals', async () => {
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '3' }], rowCount: 1 });
    const res = await request(app).get('/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ users: 5, orders: 3, total: 8 });
  });

  it('forwards db errors to the error handler', async () => {
    jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).get('/admin/stats');
    expect(res.status).toBe(500);
  });
});
