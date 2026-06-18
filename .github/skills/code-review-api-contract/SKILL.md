---
name: code-review-api-contract
description: REST API contract checks for pull request review. Use this skill when reviewing pull requests in this Node.js/TypeScript Express API to catch breaking changes to existing routes, incorrect HTTP status codes, non-RESTful naming, response shape drift, and skew between route handlers and the README or schema documentation.
---

# API contract review

This service exposes a small REST API. Treat existing route paths,
methods, request bodies, response shapes, and status codes as a contract.
Prefix findings with `[code-review-api-contract]`.

## Checklist

1. **Breaking changes to existing routes.** Flag any of the following
   when applied to a route that already exists on `main`:
   - Path or method change.
   - Removed or renamed required request field.
   - Removed or renamed response field.
   - Changed type of an existing response field.
   - Changed status code for the same logical outcome (for example
     `201 Created` becoming `200 OK` for `POST /users`).

   For each, propose a non-breaking alternative (for example: keep the
   old field as a deprecated alias, or add a new route/version).

2. **Status code conventions.** Use:
   - `200` for successful read or update returning a body.
   - `201` for successful resource creation, with the created resource in
     the body.
   - `204` for successful action with no body.
   - `400` for client-side validation failures.
   - `401` for missing/invalid authentication.
   - `403` for authenticated-but-not-authorized.
   - `404` for resource not found.
   - `409` for conflicts (for example, duplicate unique key).
   - `500` only for unexpected server errors.

   Flag any handler that uses a code outside these conventions.

3. **REST naming.** Flag verb-in-path routes (`/getUser`, `/createOrder`),
   non-plural collections (`/user` for a list), and mixed casing
   (`/userOrders` vs `/user-orders`). This repo uses lowercase plural
   nouns and `kebab-case` segments (for example `/orders/by-user/:userId`).

4. **Response shape consistency.** Error responses must be
   `{ "error": "<snake_case_code>" }`. Successful collection responses
   must be `{ "<resource>": [...], "limit": number, "offset": number }`.
   Flag handlers that diverge.

5. **Doc/handler skew.** When a route is added, changed, or removed,
   check that `README.md` (and any `*.md` under `docs/` if present) is
   updated to match. If not, comment with the diff that should be applied
   to the docs.

6. **Idempotency.** `GET`, `PUT`, and `DELETE` must be idempotent. Flag
   `GET` handlers with side effects, and `PUT` handlers that behave like
   `POST`.

## Reporting format

```
[code-review-api-contract] <one-line summary>

<short rationale referencing the checklist item, e.g. "Item 1: POST /users
now returns 200 with { user_id }; previous contract was 201 with
{ id, email, name }">

<optional GitHub suggestion block restoring the contract>
```
