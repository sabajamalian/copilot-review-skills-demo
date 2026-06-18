import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db/client';

describe('users routes', () => {
  const app = createApp();

  beforeEach(() => {
    db.seed();
  });

  it('GET /users returns the seeded users', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0]).toMatchObject({ email: 'ada@example.com' });
  });

  it('GET /users/:id returns a single user', async () => {
    const res = await request(app).get('/users/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, email: 'ada@example.com' });
  });

  it('GET /users/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/users/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  it('GET /users/:id returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/users/abc');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_id' });
  });

  it('POST /users creates a user and returns 201 with id+email+name', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'grace@example.com', name: 'Grace Hopper' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      email: 'grace@example.com',
      name: 'Grace Hopper'
    });
  });

  it('POST /users rejects invalid email', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'not-an-email', name: 'Nope' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_email' });
  });

  it('POST /users rejects empty name', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'ok@example.com', name: '' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_name' });
  });
});
