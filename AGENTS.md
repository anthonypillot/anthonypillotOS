# AGENTS.md - anthonypillotOS Development Instructions

## Project Overview

Personal portfolio / "OS" built with **Nuxt 4** + **Vue 3** + **TypeScript** + **Prisma**. Hosts open-source tools: **GitHub History Cleaner** and **Task Hold'em** (Socket.IO planning poker).

- Setup, deployment, license: see [README.md](README.md)
- Version history: [docs/CHANGELOG.md](docs/CHANGELOG.md)
- Framework reference (LLM-friendly): [nuxt.com/llms.txt](https://nuxt.com/llms.txt)
- UI library reference (LLM-friendly): [ui.nuxt.com/llms.txt](https://ui.nuxt.com/llms.txt)

## Stack

- **Framework**: Nuxt 4 (compatibilityDate: 2025-03-15) — frontend lives in `app/`, Nitro backend in `server/`
- **UI**: Vue 3 SFCs, `<script setup lang="ts">`, Nuxt UI v4 (`@nuxt/ui`), Tailwind v4
- **Database**: Prisma + PostgreSQL (`prisma/schema.prisma`); binary targets include `linux-arm64-openssl-3.0.x` for the k8s build
- **Realtime**: Socket.IO with `@socket.io/postgres-adapter` (rooms + sessionId tracking)
- **Validation**: Zod v4 in every POST handler
- **Logging**: Consola (`server/utils/logger.ts`); JSON in production, pretty in dev; `LOG_LEVEL=debug` enables trace
- **Unit tests**: Vitest (server-only, `environment: "nuxt"`) + MSW for HTTP mocking
- **E2E tests**: Playwright across 6 browser projects, scheduled weekly (Sat 10:00 UTC)
- **Analytics**: Matomo (only in production non-localhost, `app/plugins/matomo.client.ts`)
- **Deployment**: multi-stage Docker (distroless Node 24) → GHCR → Kubernetes (see `.github/workflows/`)

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server in foreground (blocks the terminal) |
| `npm run build` | `npm run clean` + `nuxt build` |
| `npm run generate` | Static generation (`nuxt generate`) |
| `npm run preview` | Preview production build |
| `npm run start` | `build` + `preview` (Playwright uses this locally) |
| `npm run lint` | **`nuxt typecheck && eslint .`** — both must pass |
| `npm run test` | Vitest unit tests (server-only) |
| `npm run test:coverage` | Vitest with v8 coverage |
| `npm run test:e2e` | Playwright (locally auto-starts `npm run start` unless CI) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:show-report` | Open the last Playwright HTML report |
| `npm run test:e2e:update-snapshots` | Update Playwright snapshots |
| `npm run clean` | Remove `.nuxt`, `.output`, `coverage`, `playwright-report`, `test-results` |

> **`postinstall`** runs `prisma generate && nuxt prepare` automatically. After cloning, you also need to push the schema (`npx prisma db push`) and copy `.env.example` to `.env` with `POSTGRES_PRISMA_URL` set — see `.env.example` for a local Postgres `docker run`.

> **Dev server**: `npm run dev` blocks the terminal. Agents must **not** boot it themselves. If the application needs to be running (manual UI testing, E2E debugging, etc.), use the `question` tool to ask the user to start the dev server on their side.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `POSTGRES_PRISMA_URL` | PostgreSQL connection URL (required) |
| `NODE_ENV` | `production` switches logger to JSON output |
| `LOG_LEVEL` | `debug` enables trace-level logging |
| `ENV` | Environment identifier (default `local`); exposed in `/api` payload and logs |
| `CI` | Disables Playwright webServer reuse, sets `currentUrl` to `prep.anthonypillot.com` |

## Directory Structure

```
app/                            # Nuxt frontend
├── app.vue                     # Root layout (UApp + BaseHeader + BaseFooter)
├── app.config.ts               # Nuxt UI theme: primary=indigo, neutral=gray
├── error.vue                   # Global error page
├── assets/css/main.css         # Tailwind v4 directives
├── components/                 # Auto-imported; subdir name prefixes the component
│    ├── base/                  # BaseHeader, BaseFooter, BaseHero, BaseCareerHistory, ...
│    ├── form/                  # Feedback.vue
│    ├── github/                # GithubHistoryCleaner, GithubHistoryCleanerHero
│    ├── socket/                # TechnicalData.client.vue (client-only)
│    └── task-holdem/           # Actions, Card, Chat, CreateUser, PokerPlayer, PokerTable, User
├── composables/                # Auto-imported (useX pattern)
│    ├── useAvatar.ts
│    ├── useClickOutside.ts
│    └── useSeo.ts
├── data/                       # (currently empty; reserved for static app data)
├── pages/                      # File-based routing
│    ├── index.vue
│    └── tools/
│        ├── index.vue
│        ├── github/history-cleaner.vue
│        └── task-holdem/
│            ├── index.vue
│            └── application.client.vue   # Client-only (uses Socket.IO + window)
└── plugins/
     └── matomo.client.ts       # Matomo (production non-localhost only)

server/                         # Nitro backend (Node 24 runtime)
├── api/
│    ├── index.ts               # GET /api → app/version/env/dependencies
│    ├── icons.ts               # GET /api/icons (lists public/svg/icons)
│    ├── form/feedback.post.ts
│    ├── health/live.ts         # Liveness probe
│    ├── health/ready.ts        # Readiness probe (checks Postgres)
│    └── tools/github/history-cleaner.post.ts
├── config/api/github.config.ts # $fetch instance for api.github.com
├── dao/                        # Prisma queries (one *.dao.ts per domain)
├── plugins/
│    ├── bootstrap.server.ts    # Logs version + ENV + GIT_SHA on startup
│    ├── error-handler.server.ts
│    └── task-holdem.server.ts  # Socket.IO server + WS mount at /api/websocket/task-holdem
├── services/                   # Business logic (one *.service.ts per domain)
├── tests/                      # Vitest unit tests (server/**) + MSW + JSON fixtures
│    ├── data/workflowRunsApiResponse.github.json
│    ├── dao/*.nuxt.test.ts
│    └── services/*.nuxt.test.ts
├── tsconfig.json               # extends .nuxt/tsconfig.server.json
├── types/                      # Server-only types (enums + GitHub API shapes)
└── utils/logger.ts             # Consola (global `logger`)

shared/types/                   # Types auto-imported as GLOBALS in both client and server
   ├── history-cleaner.type.ts  # HistoryCleanerForm, HistoryCleanerResultFiltered
   └── task-holdem.type.ts      # Room, GameStatus, ServerToClientEvents, ClientToServerEvents,
                                #   taskHoldemApplication, prefixLog

tests/e2e/                      # Playwright E2E tests
├── configuration.ts            # baseUrl switches on CI; exports `currentUrl` + `application`
└── pages/                      # One *.test.ts per page (mirror of app/pages)

prisma/                         # Prisma schema (PostgreSQL; snake_case columns via @map)
```

> **Cache issue**: If `.nuxt/cache/nuxt/payload` becomes a file instead of a directory, you'll get `ENOTDIR` errors. Fix: `npm run clean && npm run dev`.

> **Global `logger`**: `server/utils/logger.ts` is auto-imported everywhere on the server. Use `logger.start/info/success/error/debug/trace` (consola methods).

> **Global shared types**: Types in `shared/types/` are auto-imported in client and server (e.g., `Room`, `prefixLog`, `taskHoldemApplication`, `HistoryCleanerForm`). Do not import them explicitly.

## Page Conventions

Every page uses `<script setup lang="ts">` and calls `useSeo()` for metadata:

```vue
<template>
   <Hero />
   <Content />
</template>

<script setup lang="ts">
const description = "Descriptive text here.";
useSeo({
  title: "Page Title",
  description,
});
</script>
```

- Nested routes use directories with `index.vue` (e.g., `app/pages/tools/task-holdem/index.vue`).
- Client-only pages use the `.client.vue` suffix — only loaded in the browser, can safely use `window` / WebSocket. Example: `app/pages/tools/task-holdem/application.client.vue` (Task Hold'em game).

## Component Conventions

- Components follow **PascalCase** filenames and live under `app/components/<feature>/<Name>.vue`.
- The **directory name becomes the component prefix**: `app/components/base/Header.vue` → `<BaseHeader>` (no doubling), `app/components/github/HistoryCleaner.vue` → `<GithubHistoryCleaner>`, `app/components/task-holdem/PokerTable.vue` → `<TaskHoldemPokerTable>`.
- Auto-imported by Nuxt — no manual imports in pages.
- Use `<script setup lang="ts">` with explicit type annotations.
- Styling via Tailwind classes only; no `<style>` blocks.
- Client-only components use the `.client.vue` suffix (e.g., `app/components/socket/TechnicalData.client.vue`).

## Server API Conventions

- File-based routing via Nitro: `server/api/foo/bar.post.ts` → `POST /api/foo/bar`.
- `defineEventHandler()` is the export; use `readBody`, `createError`, `setResponseStatus`.
- **Layer pattern**: API handler → service → DAO. Handlers do validation (Zod) + translation to H3 errors; services contain business logic; DAOs wrap Prisma.
- Prisma `PrismaClient` is instantiated at module level in each DAO (no shared client).
- `server/api/icons.ts` reads `public/svg/icons` at request time — no caching.

## Import Aliases

- `@/` — Root of `app/` directory (e.g., `@/components/form/Feedback.vue`)
- `@@/` — Project root (e.g., `@@/server/services/feedback.service`, `@@/package.json`)
- Use `@@/` for **server-side** imports to avoid Nuxt alias conflicts. Client code can use `@/`.

## Composables

Auto-imported from `app/composables/`. Follow the `useX.ts` naming convention with `export default`:

```ts
export default function useMyComposable() {
   // ...
}
```

Current composables: `useAvatar`, `useClickOutside`, `useSeo`. `useSeo()` (no args) sets site-wide defaults; pass `{ title, description, favicon }` to override.

## Code Style

- **Indentation**: **2 spaces** (verified across all source files; no tab characters).
- **TS strictness** (`tsconfig.json`): `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all on — non-null assertions and unchecked index access will fail lint.
- **Imports**: Explicit imports; auto-imported composables/components need no import.
- **String quotes**: Double quotes (`"`), single quotes only in some composables.
- **Export syntax**: `export default` for composables, API handlers, and Nuxt pages.

## Testing Conventions

### Unit Tests (Vitest)

- Server tests live in `server/tests/` with `.nuxt.test.ts` suffix
- Configuration via `vitest.config.ts` using Nuxt environment (`environment: "nuxt"`)
- Use MSW (`msw`) for mocking HTTP requests (GitHub API, etc.)
- Silence logger in tests: `logger.level = -999` in `beforeAll`
- Mock DAOs with `vi.spyOn(module, "function").mockResolvedValue(...)`
- Large fixtures live in `server/tests/data/` (e.g., `workflowRunsApiResponse.github.json`)

### E2E Tests (Playwright)

- Live under `tests/e2e/` (one `*.test.ts` per page; mirrors `app/pages/`).
- Run via `npm run test:e2e`, or with UI mode: `npm run test:e2e:ui`.
- Base URL from `tests/e2e/configuration.ts` (local by default, prep in CI) — auto-imports `currentUrl` and `application` paths.
- **Local Playwright** auto-runs `npm run start` as a webServer; in CI it's expected to be reachable already.
- Multi-browser: Chromium, Firefox, Safari, iPad, Pixel 5, iPhone 12.
- Scheduled weekly via CI (Saturday 10:00 UTC), 2 retries on CI; long-running suite is `continue-on-error: true`.
- The E2E for the GitHub History Cleaner mutates the live API in one test — it's gated by `if (!process.env.CI)` and Playwright mocks the route instead.

## Git Conventions

Uses **Conventional Commits** (see [spec](https://www.conventionalcommits.org/en/v1.0.0/)). Recent patterns:

| Pattern | Example |
| --- | --- |
| Feature/additions | `feat: ...` |
| Bug fixes | `fix: ...` |
| Performance | `perf(deps): update dependencies` |
| Releases (automated by semantic-release on push to `main`) | `chore(release): 1.3.19` |

`.releaserc` config: `main` (stable) + `beta` (prerelease) + maintenance `+([0-9])?(.{+([0-9]),x}).x` branches. Skip CI with `[skip ci]` in commit body.

## CI/CD Workflows (`.github/workflows/`)

All four use shared reusable workflows from `anthonypillot/actions@v1`.

- **build-and-push.yaml** — on PR to `main`: extract version → build (with `run_test`, `run_lint`) → push to GHCR (`ghcr.io/anthonypillot/os`) → deploy to Kubernetes `os-prep` (pre-production).
- **build-and-push-release.yaml** — on GitHub release published: same as above + deploy to **both** `os-prod` and `os-prep`.
- **release.yaml** — on push to `main`: `npx semantic-release` with `GH_PAT` secret.
- **end-to-end.yaml** — weekly cron `0 10 * * 6` + `workflow_dispatch` → `npm ci` → `npx playwright install --with-deps` → `npx playwright test` → upload `playwright-report/` artifact (7-day retention).

## Runtime Config

Public config lives in `nuxt.config.ts` under `runtimeConfig.public` (title, description, version, author, logo URLs, external links). Use `useRuntimeConfig()` in composables/pages. The `version` is pulled from `package.json` at build time, `git_sha` is injected by Dockerfile's `ARG GIT_SHA` → `ENV GIT_SHA` and surfaced via `GET /api` and the startup log.

## Known Issues

- **Nuxt 4 cache issue**: If `.nuxt/cache/nuxt/payload` becomes a file instead of a directory, you'll get `ENOTDIR` errors when visiting SWR routes. Fix by running `npm run clean && npm run dev`.
- **SWR routeRules**: Routes with `swr: true` in `nuxt.config.ts` (`/`, `/tools/github/history-cleaner`, `/tools/task-holdem`) require the cache directory to exist properly.
- **UModal programmatic open**: Use `#body` + `#footer` slots, not `#content` (requires a default-slot trigger).
- **Icon name variants**: `i-heroicons-<name>-20-solid` (suffix comes after the name), not `i-heroicons-20-solid-<name>`.

## Docker Build

```bash
docker build --no-cache -t os:latest . \
&& docker run --rm --name=os -p 3000:3000 os:latest
```

Multi-stage: `node:24` builder → `gcr.io/distroless/nodejs24-debian13` runtime, runs `./server/index.mjs` on port 3000. Pass `GIT_SHA` as a build arg.
