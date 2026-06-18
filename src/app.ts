import express, { Application, Request, Response } from 'express';
import users from './routes/users';
import orders from './routes/orders';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/users', users);
  app.use('/orders', orders);

  app.use(errorHandler);
  return app;
}
