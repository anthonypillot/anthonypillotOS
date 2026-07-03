# AGENTS.md

This file provides guidance to Code Agents when working with code in this repository.

## What this is

`anthonypillotOS` is Anthony Pillot's personal website — a Nuxt 4 app themed as an "operating system" that introduces him and ships a few open-source IT tools. The interactive tools (under `/tools`) are the substantive code:

- **Task Hold'em** — real-time collaborative planning-poker over Socket.IO (rooms, users, chat, voting).
- **GitHub History Cleaner** — bulk-deletes a repo's workflow runs / deployments via the GitHub API, persisting job results.
- **IT Facts** — a client-side true/false trivia mini-game.

## Commands

```bash
npm run dev                     # dev server on http://localhost:3000
npm run lint                    # nuxt typecheck && eslint .  (run before committing)
npm run build                   # clean + nuxt build
npm run start                   # build then preview (what Playwright boots against)

npm run test                    # Vitest — SERVER-side unit tests only
npm run test:coverage           # Vitest with v8 coverage
npm run test:e2e                # Playwright e2e (auto-runs `npm run start` locally)
npm run test:e2e:ui             # Playwright UI mode
npm run test:e2e:update-snapshots

npx vitest run server/tests/services/history-cleaner.service.nuxt.test.ts   # single unit test file
npx playwright test tests/e2e/<file> --project="Desktop - Chromium"          # single e2e / one browser
```

Database (PostgreSQL required — Task Hold'em rooms, history-cleaner jobs, feedback, and the Socket.IO postgres adapter all persist here):

```bash
npx prisma db push              # first-time schema sync
npx prisma migrate dev          # migrations for existing setups
npx prisma generate             # regenerate client (also runs on postinstall)
```

Copy `.env.example` → `.env` and set `POSTGRES_PRISMA_URL`. See README for the `postgres:16-alpine` docker one-liner.

## Architecture

Standard Nuxt 4 layout with a `server/` Nitro backend and a `shared/` boundary.

- **`app/`** — Vue 3 frontend. Components are grouped by feature (`components/task-holdem/`, `components/github/`, `components/it-facts/`, plus `components/base/` for the site chrome). Pages live under `app/pages/` with tools at `app/pages/tools/**`. `.client.vue` suffix = client-only rendering (used for the Socket.IO and canvas/physics-heavy views).
- **`server/`** — Nitro backend, layered strictly **api → service → dao**:
  - `api/**` — HTTP route handlers (e.g. `api/tools/github/history-cleaner.post.ts`, `api/health/{live,ready}.ts`, `api/form/feedback.post.ts`). Nitro file-based routing.
  - `services/**` — business logic; the only layer `api/` and socket plugins call.
  - `dao/**` — Prisma/GitHub data access; each DAO owns its `new PrismaClient()`. Only services call DAOs.
- **`shared/`** — types and data imported by BOTH `app/` and `server/` (`shared/types/*.type.ts`, `shared/data/it-facts.data.ts`). Put anything cross-boundary here, not in one side.
- **`prisma/schema.prisma`** — Postgres models. DB columns are snake_case via `@map`; Prisma fields stay camelCase.

### Real-time (Task Hold'em)

Socket.IO is wired up manually in `server/plugins/task-holdem.server.ts` (a Nitro plugin), bound to engine.io and mounted at `/api/websocket/task-holdem` through Nitro's experimental websocket support (`nuxt.config.ts` → `nitro.experimental.websocket`). It uses the `@socket.io/postgres-adapter` so multiple server instances stay in sync (this app is deployed to Kubernetes). Socket event contracts (`ClientToServerEvents`/`ServerToClientEvents`, `Room`, `prefixLog`) live in `shared/types/task-holdem.type.ts`. The socket handler delegates all state changes to `services/task-holdem.service.ts`.

### Auto-imports (important)

Nuxt/Nitro auto-imports mean **`logger`, `prefixLog`, `convertConsoleLogToCustomLogger`, `useRuntimeConfig`, `Room`, socket event types, etc. are used WITHOUT import statements** in server code. `logger` comes from `server/utils/logger.ts` (a consola instance; JSON reporter in production). If a symbol appears undefined, check `server/utils/`, `shared/types/`, and `.nuxt/` generated types before adding an import.

### Config & runtime

- Public config (URLs, logos, links, version) is centralized in `nuxt.config.ts` → `runtimeConfig.public`, sourced from `package.json`. Access via `useRuntimeConfig().public`.
- `server/plugins/bootstrap.server.ts` runs startup logging; `error-handler.server.ts` handles Nitro errors.
- `GIT_SHA` build-arg surfaces the commit in `/api` and startup logs; `ENV` and `LOG_LEVEL=debug` control environment label and verbosity.

### Testing specifics

- Vitest is **server-only** (`vitest.config.ts` → `include: server/**`, environment `nuxt`). Test files use the `*.nuxt.test.ts` naming and live in `server/tests/`. There is no frontend unit-test setup — UI is covered by Playwright.
- Playwright (`playwright.config.ts`) runs across Chromium/Firefox/Safari desktop + tablet + mobile projects; tests in `tests/e2e/`. Locally it boots `npm run start` itself; on CI (`process.env.CI`) it expects the server already running.

## Conventions

- **Conventional Commits** (enforced by semantic-release, which drives versioning and `docs/CHANGELOG.md`). Do not hand-edit the version in `package.json` or the changelog.
- TypeScript is strict, including `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` — lint will fail on unused vars and unchecked array indexing.
- UI is built on `@nuxt/ui` v4 + Tailwind v4; icons via `@iconify-json/heroicons`.

## Spec-driven changes (OpenSpec)

Non-trivial features are planned under `openspec/changes/<change-name>/` with `proposal.md` (what & why), `design.md` (how), `tasks.md` (steps), and `specs/`. The `.opencode/commands/opsx-*.md` files define the propose → apply → archive workflow via the `openspec` CLI. When adding a substantial feature, follow the existing changes as templates rather than inventing an ad-hoc structure.
