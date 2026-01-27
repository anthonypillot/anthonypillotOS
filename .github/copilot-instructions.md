# Copilot Instructions for anthonypillotOS

## Project Overview

A **Nuxt 4** personal portfolio and tools platform with real-time features. The app serves as Anthony Pillot's professional website with integrated open-source tools:
- **GitHub History Cleaner**: Tool to bulk-delete GitHub workflow runs/deployments
- **TaskHold'em**: Real-time poker planning tool for Scrum teams using WebSockets

## Architecture

### Directory Structure
- `app/` - Nuxt frontend (pages, components, composables)
- `server/` - Nitro backend (API routes, services, DAOs, plugins)
- `shared/types/` - Types shared between frontend and backend
- `prisma/` - Database schema (PostgreSQL)
- `tests/e2e/` - Playwright E2E tests

### Layered Backend Pattern
Server follows DAO → Service → API route pattern:
```
server/api/        → HTTP handlers with Zod validation
server/services/   → Business logic
server/dao/        → Data access (Prisma, external APIs)
server/types/      → Server-specific types
server/config/     → API configurations (e.g., GitHub API)
```

### Import Aliases
- `@@/` - Project root (use for server imports: `@@/server/...`)
- `@/` - App directory (use for frontend imports: `@/components/...`)

## Key Patterns

### API Routes
- Use Zod for request validation in API handlers
- Throw errors with `createError({ statusCode, statusMessage, message })`
- Server-side logger: `import { logger } from "@@/server/utils/logger"`

### WebSocket (TaskHold'em)
Real-time features use Socket.io with PostgreSQL adapter for horizontal scaling:
- Server plugin: `server/plugins/task-holdem.server.ts`
- Endpoint: `/api/websocket/task-holdem`
- Type definitions in `shared/types/task-holdem.type.ts` define `ServerToClientEvents` and `ClientToServerEvents`

### Frontend Conventions
- Use `useSeo()` composable for page metadata
- Components use Vue 3 `<script setup>` syntax
- UI: Tailwind CSS + @headlessui/vue + @heroicons/vue

## Development Commands

```bash
npm run dev           # Start dev server (localhost:3000)
npm run test          # Vitest unit tests (server-side only)
npm run test:e2e      # Playwright E2E tests (requires running server)
npm run lint          # TypeScript type checking (nuxt typecheck)
npm run build         # Production build
```

## Testing

### Unit Tests (Vitest)
- Located in `server/tests/` with `.nuxt.test.ts` suffix
- Mock external dependencies using `vi.spyOn()`
- Test files mirror service/DAO structure

### E2E Tests (Playwright)
- Located in `tests/e2e/pages/`
- Configuration in `tests/e2e/configuration.ts` handles local/CI URLs
- Run against `prep.anthonypillot.com` in CI, `localhost:3000` locally

## Database

PostgreSQL with Prisma ORM. After schema changes:
```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

Environment: `POSTGRES_PRISMA_URL`

## Git Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:`, `fix:`, `perf:`, `docs:`, `chore:`, etc.
- Semantic release handles versioning automatically
