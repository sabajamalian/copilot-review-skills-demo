-- Reference schema for the demo app. Not executed at runtime; the app uses
-- an in-memory client in src/db/client.ts so the demo runs without a real DB.

CREATE TABLE IF NOT EXISTS users (
  id        SERIAL PRIMARY KEY,
  email     TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE TABLE IF NOT EXISTS orders (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  status    TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
