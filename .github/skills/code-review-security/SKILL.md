---
name: code-review-security
description: Security-focused checks for pull request review. Use this skill when reviewing pull requests in this Node.js/TypeScript Express API to catch security issues such as SQL injection, missing authentication, hardcoded secrets, weak JWT configuration, unsafe child_process or eval usage, missing input validation, permissive CORS, and sensitive data leaking into logs.
---

# Security review

When reviewing a pull request, scan changed files for the issues below.
Comment on each finding with the skill prefix `[code-review-security]` and,
where possible, include a GitHub suggested-change block.

## Checklist

1. **SQL injection.** Flag any query built by string concatenation or
   template literals containing user input. All queries must use the
   parameterized form `db.query('... $1 ...', [value])`. Treat
   `req.query.*`, `req.params.*`, `req.body.*`, and headers as user input.
2. **Missing authentication and authorization.** Any new route that returns
   or mutates user-owned data must use `requireAuth` from
   `src/middleware/auth.ts` and check that the resource belongs to
   `req.userId`. Public routes should be limited to clearly public data
   (for example `/healthz`).
3. **Hardcoded secrets.** Flag literal strings that look like API keys,
   tokens, passwords, JWT secrets, connection strings, or private keys
   (heuristics: high-entropy strings, names containing `secret`, `key`,
   `password`, `token`, `dsn`, `-----BEGIN`).
4. **JWT configuration.** Reject `algorithms` lists containing `none`,
   missing `algorithms` option on `jwt.verify`, and tokens signed without
   `expiresIn`. Verification must pin `algorithms: ['HS256']` (or another
   explicit asymmetric algorithm).
5. **Unsafe code execution.** Flag `eval`, `new Function`, and
   `child_process.exec` / `execSync` called with any value derived from a
   request. Prefer `execFile` with an argument array, or remove entirely.
6. **Input validation.** New request handlers must validate types, lengths,
   and ranges before use. Numeric IDs must be checked with
   `Number.isInteger(id) && id > 0`. Strings used as identifiers must be
   length-bounded.
7. **CORS.** Flag `cors({ origin: '*' })` or reflective origin echoes on
   any route that requires authentication.
8. **Log hygiene.** Flag log statements that include `Authorization`
   headers, cookies, raw request bodies, JWTs, password fields, or full
   query strings on authenticated routes. Logging should use the structured
   `logger` in `src/lib/logger.ts` and emit only field-level data.

## Reporting format

For each finding, write a comment in the form:

```
[code-review-security] <one-line summary>

<short rationale referencing the checklist item, e.g. "Item 1: SQL
injection via string concatenation of req.query.q">

<optional GitHub suggestion block>
```

Group all security findings under a single review section so reviewers can
see them at a glance.
