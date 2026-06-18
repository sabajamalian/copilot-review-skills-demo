/**
 * Tiny in-memory SQL-ish client used only for the demo so the app runs
 * without a real Postgres. The interface mimics a parameterized query
 * client (`query(sql, params)`) so the surrounding code reads like a
 * realistic data layer.
 */

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_cents: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  created_at: string;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

class InMemoryDb {
  private users: User[] = [];
  private orders: Order[] = [];
  private nextUserId = 1;
  private nextOrderId = 1;

  reset(): void {
    this.users = [];
    this.orders = [];
    this.nextUserId = 1;
    this.nextOrderId = 1;
  }

  seed(): void {
    this.reset();
    this.users.push(
      { id: this.nextUserId++, email: 'ada@example.com', name: 'Ada Lovelace', created_at: new Date().toISOString() },
      { id: this.nextUserId++, email: 'alan@example.com', name: 'Alan Turing', created_at: new Date().toISOString() }
    );
    this.orders.push(
      { id: this.nextOrderId++, user_id: 1, total_cents: 4200, status: 'paid', created_at: new Date().toISOString() },
      { id: this.nextOrderId++, user_id: 1, total_cents: 1500, status: 'pending', created_at: new Date().toISOString() },
      { id: this.nextOrderId++, user_id: 2, total_cents: 9999, status: 'shipped', created_at: new Date().toISOString() }
    );
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const text = sql.trim().toLowerCase();

    if (text.startsWith('select * from users where id =')) {
      const id = Number(params[0]);
      const rows = this.users.filter((u) => u.id === id) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    if (text.startsWith('select * from users order by id') && text.includes('limit')) {
      const limit = Number(params[0]) || 50;
      const offset = Number(params[1]) || 0;
      const rows = this.users.slice(offset, offset + limit) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    if (text.startsWith('insert into users')) {
      const [email, name] = params as [string, string];
      const user: User = {
        id: this.nextUserId++,
        email,
        name,
        created_at: new Date().toISOString()
      };
      this.users.push(user);
      return { rows: [user] as unknown as T[], rowCount: 1 };
    }

    if (text.startsWith('select * from orders where user_id = $1')) {
      const userId = Number(params[0]);
      const rows = this.orders.filter((o) => o.user_id === userId) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    if (text.startsWith('select * from orders order by id')) {
      const limit = Number(params[0]) || 50;
      const offset = Number(params[1]) || 0;
      const rows = this.orders.slice(offset, offset + limit) as unknown as T[];
      return { rows, rowCount: rows.length };
    }

    throw new Error(`Unsupported query in demo client: ${sql}`);
  }
}

export const db = new InMemoryDb();
db.seed();
