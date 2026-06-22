import { parseRange, summarizeUser, isAdminAction } from '../src/lib/adminUtils';

describe('parseRange', () => {
  it('returns default range when called with undefined', () => {
    expect(parseRange(undefined)).toEqual({ ok: true, from: 1, to: 1000 });
  });

  it('returns default range when called with an empty string', () => {
    expect(parseRange('')).toEqual({ ok: true, from: 1, to: 1000 });
  });

  it('rejects a single-segment string', () => {
    expect(parseRange('100')).toEqual({ ok: false, from: 0, to: 0 });
  });

  it('rejects non-integer parts', () => {
    expect(parseRange('1.5-10')).toEqual({ ok: false, from: 0, to: 0 });
  });

  it('rejects from < 1', () => {
    expect(parseRange('0-100')).toEqual({ ok: false, from: 0, to: 0 });
  });

  it('rejects to < from', () => {
    expect(parseRange('50-10')).toEqual({ ok: false, from: 0, to: 0 });
  });

  it('rejects span > 10000', () => {
    expect(parseRange('1-10002')).toEqual({ ok: false, from: 0, to: 0 });
  });

  it('accepts a valid range', () => {
    expect(parseRange('5-50')).toEqual({ ok: true, from: 5, to: 50 });
  });
});

describe('summarizeUser', () => {
  it('uses the trimmed name as display when name is present', () => {
    const s = summarizeUser({ id: 1, email: 'ada@example.com', name: 'Ada Lovelace', created_at: '' });
    expect(s.display).toBe('Ada Lovelace');
  });

  it('falls back to email prefix when name is whitespace only', () => {
    const s = summarizeUser({ id: 1, email: 'ada@example.com', name: '   ', created_at: '' });
    expect(s.display).toBe('ada');
  });

  it('returns "unknown" when email prefix is empty', () => {
    const s = summarizeUser({ id: 1, email: '@domain.com', name: '', created_at: '' });
    expect(s.display).toBe('unknown');
  });

  it('returns id and email unchanged', () => {
    const s = summarizeUser({ id: 42, email: 'test@example.com', name: 'Tester', created_at: '' });
    expect(s.id).toBe(42);
    expect(s.email).toBe('test@example.com');
  });
});

describe('isAdminAction', () => {
  it('accepts known actions', () => {
    expect(isAdminAction('suspend')).toBe(true);
    expect(isAdminAction('reactivate')).toBe(true);
    expect(isAdminAction('delete')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isAdminAction('ban')).toBe(false);
    expect(isAdminAction(null)).toBe(false);
    expect(isAdminAction(undefined)).toBe(false);
    expect(isAdminAction(42)).toBe(false);
  });
});
