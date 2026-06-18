---
name: code-review-test-coverage
description: Test-coverage checks for pull request review. Use this skill when reviewing pull requests in this Node.js/TypeScript Express API to catch source changes that ship without test changes, assertion-less or happy-path-only tests, skipped or focused tests, and missing coverage of new branches.
---

# Test coverage review

Tests live under `tests/` using Jest + Supertest. Prefix findings with
`[code-review-test-coverage]`.

## Checklist

1. **Source change without tests.** Any added or changed file under
   `src/routes/`, `src/middleware/`, or `src/db/` should be accompanied
   by added or changed tests. If the PR diff touches such a file but
   `tests/**` is unchanged, flag the file and propose at least one test
   case per added branch.

2. **Assertion-less tests.** Flag `it(...)` / `test(...)` blocks whose
   bodies do not call `expect`. A test that only calls a handler is not
   a test.

3. **Happy-path-only.** For new routes or new branches, require at least:
   - One success case asserting status code and response shape.
   - One validation-failure case (`400`).
   - One not-found case (`404`) where applicable.
   - One unauthorized case (`401`) for authenticated routes.

   Flag tests that only cover the success path.

4. **Focused or skipped tests.** Flag `.only` (`it.only`, `describe.only`,
   `test.only`) and `.skip` left in committed code. Permanent skips must
   include a tracking issue link in a comment.

5. **Branch coverage on changed code.** For every new `if` / `else` /
   `switch` arm or `try` / `catch` in changed source, expect a test that
   exercises that arm. Flag missing arms by name.

6. **Snapshot drift without intent.** If a `__snapshots__` file changes
   without a corresponding behavioral change in the PR description, flag
   it for the author to confirm the new snapshot is intentional.

7. **Test isolation.** Tests must call `db.seed()` (or equivalent reset)
   in `beforeEach` so order-of-execution does not affect outcomes. Flag
   tests that rely on data created by a previous test.

## Reporting format

```
[code-review-test-coverage] <one-line summary>

<short rationale referencing the checklist item, e.g. "Item 1: src/routes/
search.ts is added but tests/ is unchanged. Suggest tests for at least:
empty query, single match, no match, SQL-special characters in query.">

<optional GitHub suggestion block sketching a test>
```
