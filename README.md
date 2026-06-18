# copilot-review-skills-demo

A tiny Node.js + TypeScript Express REST API that exists for one purpose:
to **demo GitHub Copilot's cloud code review agent customized via custom
skills** under `.github/skills/`.

The interesting parts of this repo are not the app, but:

- `.github/copilot-instructions.md` — repo-wide review guidance.
- `.github/skills/code-review-security/`
- `.github/skills/code-review-performance/`
- `.github/skills/code-review-api-contract/`
- `.github/skills/code-review-test-coverage/`

Each skill is a `SKILL.md` with review-focused YAML frontmatter (`name`,
`description`) plus a markdown checklist that Copilot loads when relevant
during pull request review. See GitHub's docs on
[agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
and [code review with skills and MCP](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review#mcp-servers-and-agent-skills).

## The app

A small REST API over an in-memory store (so the demo runs without a real
database). Endpoints:

| Method | Path                       | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/healthz`                 | Liveness check.                          |
| GET    | `/users`                   | Paginated list of users.                 |
| GET    | `/users/:id`               | Get one user by id.                      |
| POST   | `/users`                   | Create a user. Returns 201.              |
| GET    | `/orders`                  | Paginated list of orders.                |
| GET    | `/orders/by-user/:userId`  | List orders for one user.                |

All collection responses use `{ "<resource>": [...], "limit", "offset" }`.
All errors use `{ "error": "<snake_case_code>" }`.

### Run it

```bash
npm install
npm test
npm run dev
```

## How to demo Copilot code review

1. Make sure Copilot code review is enabled for this repository (and that
   "Allow Copilot to use MCP tools when reviewing pull requests" is on, in
   repository Copilot settings).
2. On any pull request, open the **Reviewers** menu and select **Copilot**.
3. Wait for the review. Each finding is prefixed with the relevant skill,
   for example `[code-review-security] ...`, so the audience can map
   comments back to the skill that produced them.

### Live demo PR

This repo ships with a `demo/seeded-issues` branch that intentionally
introduces one violation per skill:

- **Security:** new route concatenating user input into SQL and logging
  the `Authorization` header.
- **Performance:** N+1 query loop in an orders route.
- **API contract:** breaking change to `POST /users` response (`200`
  instead of `201`, `{ user_id }` instead of `{ id, email, name }`).
- **Test coverage:** new and changed routes with no test updates.

The PR opened from that branch is the canonical demo:
[Open the demo PR](https://github.com/sabajamalian/copilot-review-skills-demo/pulls)
(the link is filled in once the PR is created during setup).

## Repository layout

```
.
├── .github/
│   ├── copilot-instructions.md
│   ├── workflows/ci.yml
│   └── skills/
│       ├── code-review-security/SKILL.md
│       ├── code-review-performance/SKILL.md
│       ├── code-review-api-contract/SKILL.md
│       └── code-review-test-coverage/SKILL.md
├── src/
│   ├── app.ts
│   ├── index.ts
│   ├── db/
│   ├── lib/
│   ├── middleware/
│   └── routes/
└── tests/
```

## License

MIT (demo only).
