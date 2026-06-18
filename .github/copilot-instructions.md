# Copilot review instructions

This repository is a small Node.js + TypeScript Express REST API. It exists
to demo GitHub Copilot code review with custom skills.

When reviewing pull requests in this repo, follow these guidelines:

- Use the skills in `.github/skills/code-review-*` for the area each finding
  falls under, and prefix each comment with the skill name in square
  brackets, for example: `[code-review-security] ...`.
- Group findings by skill so a reader can see which area each comment came
  from.
- Prefer concise, actionable comments. When a fix is small and obvious,
  include a GitHub suggested-change block.
- If you use any MCP tools or skill scripts, briefly mention which one in
  the comment so the demo audience can trace the reasoning.
- Do not approve or request changes. Always leave a "Comment" review.

Stack notes:

- Express 4, TypeScript strict mode, Node 20.
- Data access goes through `src/db/client.ts` using parameterized queries
  (`$1`, `$2`, ...). Any string concatenation into SQL is a bug.
- All routes returning user-controlled data should paginate with `limit`
  and `offset`.
- Tests use Jest + Supertest under `tests/`.
