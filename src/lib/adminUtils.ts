import { User } from '../db/client';

export type AdminAction = 'suspend' | 'reactivate' | 'delete';

export interface RangeQuery {
  ok: boolean;
  from: number;
  to: number;
}

export function parseRange(raw: unknown): RangeQuery {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { ok: true, from: 1, to: 1000 };
  }
  const parts = raw.split('-');
  if (parts.length !== 2) {
    return { ok: false, from: 0, to: 0 };
  }
  const from = Number(parts[0]);
  const to = Number(parts[1]);
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    return { ok: false, from: 0, to: 0 };
  }
  if (from < 1 || to < from || to - from > 10000) {
    return { ok: false, from: 0, to: 0 };
  }
  return { ok: true, from, to };
}

export interface UserSummary {
  id: number;
  email: string;
  display: string;
}

export function summarizeUser(user: User): UserSummary {
  const display =
    typeof user.name === 'string' && user.name.trim().length > 0
      ? user.name.trim()
      : user.email.split('@')[0] || 'unknown';
  return {
    id: user.id,
    email: user.email,
    display,
  };
}

export function isAdminAction(value: unknown): value is AdminAction {
  return value === 'suspend' || value === 'reactivate' || value === 'delete';
}
