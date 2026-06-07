# AGENTS.md - anthonypillotOS Development Instructions

## Project Overview

Personal portfolio/portfolio OS built with **Nuxt 4**, **Vue 3**, **TypeScript**, **Tailwind CSS**, and **Prisma**. Includes open-source tools: GitHub History Cleaner and Task Hold'em.

See [README.md](README.md) for setup, deployment, and git conventions. See [docs/CHANGELOG.md](docs/CHANGELOG.md) for version history.

## Stack

- **Framework**: Nuxt 4 (compatibilityDate: 2025-03-15)
- **UI**: Vue 3 SFCs with `<script setup lang="ts">`
- **Styling**: Tailwind CSS + @tailwindcss/forms
- **Database**: Prisma + PostgreSQL (schema: `prisma/schema.prisma`)
- **Realtime**: Socket.IO (with Postgres adapter)
- **Validation**: Zod v4 in API routes
- **Logging**: Consola (`server/utils/logger.ts`)
- **Unit tests**: Vitest (server-only, MSW for HTTP mocking)
- **E2E tests**: Playwright (multi-browser, scheduled weekly via CI)
- **Analytics**: Matomo (`app/plugins/matomo.client.ts`)
- **Deployment**: Docker → Kubernetes (see `.github/workflows/`)

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run dev:detached` | Start dev server detached (background process) |
| `npm run dev:stop-detached` | Stop the detached dev server |
| `npm run build` | Clean + production build |
| `npm run preview` | Preview production build locally |
| `npm run start` | Build + preview in one step |
| `npm run lint` | Type check via `nuxt typecheck` |
| `npm run test` | Run Vitest unit tests |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright E2E tests in UI mode |
| `npm run clean` | Remove `.nuxt`, `.output`, coverage/test artifacts |

> **Note**: `postinstall` runs `prisma generate && nuxt prepare` automatically.

> **Dev server**: Use `npm run dev:detached` instead of `npm run dev`. This spawns `nuxt dev` as a detached process so the command returns immediately. Output goes to `logs/nuxt-dev.log`. Use `npm run dev:stop-detached` to stop it. The PID is stored in `logs/nuxt-dev.pid` for manual cleanup (`kill $(cat logs/nuxt-dev.pid)`).
>
> The underlying scripts are `scripts/start-dev-detached.mjs` and `scripts/stop-dev-detached.mjs`.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `POSTGRES_PRISMA_URL` | PostgreSQL connection URL (required) |
| `NODE_ENV` | Set to `production` for JSON log output |
| `LOG_LEVEL` | Set to `debug` for verbose logging |
| `ENV` | Environment identifier (default: `local`) |
| `CI` | Set in CI; affects Playwright retries/workers and E2E base URL |

## Directory Structure

```
app/                            # Nuxt frontend
├── app.vue                     # Root layout
├── assets/css/main.css         # Global styles (Tailwind directives)
├── components/                 # Auto-imported, feature-named directories
│    ├── base/                  # Shared UI: Header, Footer, Hero, etc.
│    ├── form/                  # Form-related components
│    ├── github/                # GitHub History Cleaner tool components
│    ├── socket/                # Socket.IO components
│    └── task-holdem/           # Task Hold'em game components
├── composables/                # Auto-imported composables (useX pattern)
│    └── useSeo.ts              # SEO metadata helper for all pages
├── error.vue                   # Global error page
├── pages/                      # File-based routing (Nuxt auto-routing)
│    ├── index.vue              # Home page
│    └── tools/                 # Tools section
│        ├── github/history-cleaner.vue
│        ├── task-holdem/index.vue
│        └── task-holdem/application.client.vue   # Client-only page
└── plugins/
     └── matomo.client.ts       # Matomo analytics (client-only)

server/                         # Nitro server
├── api/                        # API routes (file-based routing)
│    ├── form/feedback.post.ts           # POST /api/form/feedback
│    └── tools/github/history-cleaner.post.ts  # POST /api/tools/github/history-cleaner
├── config/                     # Server configuration modules
├── dao/                        # Data Access Objects (Prisma queries)
├── plugins/                    # Server plugins (bootstrap, Socket.IO)
├── services/                   # Business logic layer
├── tests/                      # Server-side unit tests (Vitest + MSW)
├── types/                      # Server-only type definitions
└── utils/logger.ts             # Consola logger instance

shared/types/                   # Types shared between client & server
tests/e2e/                      # Playwright E2E tests
prisma/                         # Prisma schema + migrations
```

> **Cache issue**: If `.nuxt/cache/nuxt/payload` becomes a file instead of a directory, you'll get `ENOTDIR` errors. Fix: `npm run clean && npm run dev`.

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

Pages live under `app/pages/` following Nuxt's file-based routing. Nested routes use directories with `index.vue`. Client-only pages use the `.client.vue` suffix (e.g., `application.client.vue`).

## Component Conventions

- Components follow **PascalCase** naming (e.g., `GithubHistoryCleanerHistoryCleaner.vue`, `Feedback.vue`)
- Grouped by feature/tool in subdirectories under `app/components/`
- Auto-imported by Nuxt — no manual imports needed in pages
- Use `<script setup lang="ts">` with explicit type annotations
- Use Tailwind CSS classes for styling (no `<style>` blocks)

## Server API Conventions

File-based routing via Nitro:
- `server/api/tools/github/history-cleaner.post.ts` → `POST /api/tools/github/history-cleaner`
- `server/api/icons.ts` → `GET /api/icons`
- Use `defineEventHandler()` as the export
- Separate concerns: API route → service → DAO
- API handlers call services, services call DAOs (Prisma)

## Import Aliases

- `@/` — Root of `app/` directory (e.g., `@/components/form/Feedback.vue`)
- `@@/` — Project root (e.g., `@@/server/services/feedback.service`, `@@/package.json`)
- Use `@@/` for server-side imports to avoid Nuxt alias conflicts

## Composables

Auto-imported from `app/composables/`. Follow the `useX.ts` naming convention. Example:

```ts
export default function useMyComposable() {
   // ...
}
```

## Code Style

- **Indentation**: Tabs (`nuxt typecheck` for validation)
- **Types**: Use TypeScript interfaces (see `.editorconfig`)
- **Imports**: Explicit imports; auto-imported composables/components need no import
- **String quotes**: Double quotes (`"`), unless within template `<script>` tags where single quotes may appear
- **JSX/Export syntax**: Uses `export default` for composables and API handlers

## Testing Conventions

### Unit Tests (Vitest)

- Server tests live in `server/tests/` with `.nuxt.test.ts` suffix
- Configuration via `vitest.config.ts` using Nuxt environment (`environment: "nuxt"`)
- Use MSW (`msw`) for mocking HTTP requests (GitHub API, etc.)
- Silence logger in tests: `logger.level = -999` in `beforeAll`
- Mock DAOs with `vi.spyOn(module, "function").mockResolvedValue(...)`

### E2E Tests (Playwright)

- Live under `tests/e2e/` with page objects in `tests/e2e/pages`
- Run via `npm run test:e2e`, or with UI mode: `npm run test:e2e:ui`
- Base URL from `tests/e2e/configuration.ts` (local by default, prep in CI)
- Multi-browser: Chromium, Firefox, Safari, iPad, Pixel 5, iPhone 12
- Scheduled weekly via CI (Saturday 10:00 UTC), with 2 retries on CI

## Git Conventions

Uses **Conventional Commits**. Recent patterns observed:

| Pattern | Example |
| --- | --- |
| Feature/additions | `feat: ...` |
| Bug fixes | `fix: ...` |
| Performance | `perf(deps): update dependencies` |
| Releases (automated) | `chore(release): 1.3.19` |

See [Conventional Commits spec](https://www.conventionalcommits.org/en/v1.0.0/) for full details.

## CI/CD Workflows

- **Build & Deploy** (`.github/workflows/build-and-push.yaml`): On PR to main → build, test, lint, push Docker image, deploy to Kubernetes (pre-production)
- **Release** (`.github/workflows/release.yaml`): On push to main → semantic-release for versioning and changelog
- **E2E Tests** (`.github/workflows/end-to-end.yaml`): Weekly schedule + manual trigger → Playwright tests against pre-production

## Runtime Config

Public config is defined in `nuxt.config.ts` under `runtimeConfig.public`. Use `useRuntimeConfig()` in composables/pages to access values like `title`, `description`, `author`, `logo`, and external links.

## Known Issues

- **Nuxt 4 cache issue**: If `.nuxt/cache/nuxt/payload` becomes a file instead of a directory, you'll get `ENOTDIR` errors when visiting SWR routes. Fix by running `npm run clean && npm run dev`.
- **SWR routeRules**: Routes with `swr: true` in `nuxt.config.ts` (`/`, `/tools/github/history-cleaner`, `/tools/task-holdem`) require the cache directory to exist properly.

## Docker Build

```bash
docker build --no-cache -t os:latest . \
&& docker run --rm --name=os -p 3000:3000 os:latest
```
