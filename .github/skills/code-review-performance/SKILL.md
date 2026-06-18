---
name: code-review-performance
description: Performance-focused checks for pull request review. Use this skill when reviewing pull requests in this Node.js/TypeScript Express API to catch N+1 database access, await-in-loop, synchronous I/O in request handlers, unbounded queries, missing pagination, and other latency or scalability regressions.
---

# Performance review

When reviewing a pull request, scan changed files in `src/routes/`,
`src/db/`, and any new request-path code for the issues below. Prefix
findings with `[code-review-performance]`.

## Checklist

1. **N+1 database access.** Flag patterns where a list of IDs (or a list
   returned by a previous query) is iterated and `db.query` is awaited
   inside the loop. Suggest collapsing into a single query using
   `WHERE id IN ($1, $2, ...)` or `WHERE user_id = ANY($1::int[])`, or
   use a join.
2. **Await-in-loop for independent work.** Flag `for ... await` loops
   where iterations are independent. Suggest `Promise.all` (with a
   sensible concurrency cap if the list is unbounded).
3. **Synchronous I/O in request handlers.** Flag `fs.readFileSync`,
   `fs.writeFileSync`, `child_process.execSync`, and other `*Sync`
   functions in any route handler or middleware. Suggest the async
   variants.
4. **Unbounded result sets.** Flag any user-facing route that issues a
   query without `LIMIT`, or with a limit derived from the request without
   a server-side cap. The cap in this repo is 100; new routes should
   match.
5. **Missing pagination.** New `GET` collection routes (returning arrays)
   must accept `limit` and `offset` and clamp them. Flag routes that omit
   either, and routes that read the full table and slice in JavaScript.
6. **Wide selects on hot paths.** Flag `SELECT *` on a hot path where the
   handler only uses a few columns. Suggest naming the columns explicitly.
7. **Large request/response payloads.** Flag `express.json({ limit: ... })`
   raised above 1 MB, and route handlers that buffer entire request
   streams unnecessarily.
8. **Index hints.** When a new query uses a new `WHERE` column or a new
   `ORDER BY`, check that `src/db/schema.sql` has (or proposes) a matching
   index. If not, comment with the missing index DDL.

## Reporting format

```
[code-review-performance] <one-line summary>

<short rationale referencing the checklist item, e.g. "Item 1: loops over
order IDs and awaits a query per row">

<optional GitHub suggestion block with the rewritten code>
```
