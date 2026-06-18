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
[PR #1: demo seeded issues](https://github.com/sabajamalian/copilot-review-skills-demo/pull/1).

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

## Automated coverage review on pull requests

This repo also ships a workflow,
`.github/workflows/copilot-coverage-review.yml`, that runs on every
pull request and:

1. Runs `jest --coverage --coverageReporters=json-summary` on both the
   PR's base commit and head commit.
2. Diffs the two coverage summaries with `scripts/coverage-diff.js`.
3. Captures the PR's unified diff for `src/**` and `tests/**`.
4. Installs the GitHub Copilot CLI (`npm install -g @github/copilot`)
   and runs it headlessly (`copilot -p "<prompt>"`) with a prompt that
   embeds the coverage delta plus the diff, asking Copilot to suggest
   concrete additional Jest + Supertest tests for under-covered changed
   code.
5. Posts (or updates) a single sticky PR comment containing the
   coverage delta table and Copilot's suggestions.

### Required configuration

- Repository secret `COPILOT_CLI_TOKEN`: a personal access token with
  Copilot subscription access. Used by the headless `copilot` CLI.
- The workflow uses the default `GITHUB_TOKEN` (with
  `pull-requests: write`) to post the comment.

### Behavior on forks

PRs from forks do not have access to secrets, so the workflow still
runs the coverage diff but skips the Copilot CLI step and notes that
in the PR comment.

## License

MIT (demo only).
