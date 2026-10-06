# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

### AI maslahat xarajatlari

- Uses the owner's `ANTHROPIC_API_KEY` only; no provider or payment changes.
- `AI_ADVICE_ACCOUNT_DAILY_LIMIT` defaults to **5** outbound requests per account per UTC day.
- `AI_ADVICE_GLOBAL_DAILY_LIMIT` defaults to **100** outbound requests across all accounts per UTC day.
- `AI_ADVICE_GLOBAL_TOTAL_BUDGET` defaults to **1000** outbound requests across all accounts, cumulative with no automatic reset. Increase this ceiling deliberately to authorize additional use.
- Settings are non-negative integer environment variables; **0 disables new generation** at that boundary. Invalid settings prevent startup.
- These are request/usage caps, not dollar accounting. Each call has bounded input (16,000 characters) and output (at most 1024 tokens); provider pricing still determines monetary cost.
- Every outbound attempt, including provider failures/timeouts, consumes allowance. Cached listing advice (five minutes) does not. Listing statistics remain available after a limit is reached.
- PostgreSQL reservations are atomic across server processes and durable across restarts. Both advice entry points share the same counters. Configure these values in the environment where the server runs.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
