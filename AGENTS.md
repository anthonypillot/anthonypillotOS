# AGENTS.md

## Setup and verification

- Use Node.js 24 and npm, matching CI and Docker. `npm ci` runs `nuxt prepare && prisma generate` via `postinstall`.
- TypeScript and ESLint depend on generated `.nuxt/` config. If missing, run `npx nuxt prepare`; do not edit `.nuxt/` or `.output/`.
- For DB-backed development, run PostgreSQL 18 in Docker (see `README.md` for the `postgres:18-alpine` command). Mount its data volume at `/var/lib/postgresql`, using a fresh volume when upgrading from an older major version. Configure `.env` from `.env.example` without overwriting an existing file. `POSTGRES_PRISMA_URL` feeds both Prisma and Socket.IO's `pg.Pool`.
- `npx prisma db push` initializes the local schema; there is no checked-in migration history. Regenerate the client with `npx prisma generate` after schema changes.

```sh
npm run dev                       # http://localhost:3000
npm run lint                      # Nuxt/E2E typechecks, then eslint .
npm run test -- --run              # all server tests once; npm run test watches
npx vitest run server/tests/services/history-cleaner.service.nuxt.test.ts
npm run test:coverage -- --run      # one-shot server coverage
npm run start                      # clean production build, then preview
npm run test:e2e:db:up              # disposable Docker PostgreSQL + E2E schema setup
npm run test:e2e                    # build then Playwright, all six projects
npm run test:e2e:typecheck          # standalone strict TypeScript check
npm run test:e2e:list               # discovery without app/database startup
npm run test:e2e:db:down            # discard the E2E database
npx playwright test tests/e2e/pages/index.test.ts --project="Desktop - Chromium"
```

- Run `npm run lint` before committing. `tsconfig.json` enables `noUncheckedIndexedAccess`, `noImplicitReturns`, and unused-local/parameter checks.
- `npm run build` (also called by `start`) deletes `.nuxt/`, `.output/`, `coverage/`, `playwright-report/`, and `test-results/`. Avoid concurrent builds/tests or losing reports you still need.

## Testing gotchas

- Vitest uses the Nuxt environment and only discovers tests under `server/`, currently `server/tests/**/*.nuxt.test.ts`; UI tests use Playwright. Keep `vitest.config.ts`'s `h3Version: 1` pin to match Nitro 2 despite transitive H3 v2 tooling.
- Service tests mock DAOs; GitHub DAO tests use MSW with unhandled requests treated as errors. Keep DB/GitHub interactions mocked rather than using live credentials.
- Playwright always starts the built Nitro server at `http://127.0.0.1:4173`, locally and in CI. Run `npm run build` before direct `npx playwright test` commands; `npm run test:e2e` builds first. CI runs on schedule/manual dispatch only.
- E2E uses its dedicated Docker database on port `55439`, never `.env` credentials. Fixtures block unmocked History Cleaner requests; multiplayer fixtures close contexts and delete only their test-owned rooms.
- The default Playwright run covers six desktop/tablet/mobile projects; use the focused Chromium command above for a quick check. Install browsers with `npx playwright install --with-deps` when needed.

## Wiring and boundaries

- Feature flow: HTTP handlers in `server/api/` or the Task Hold'em socket plugin → `server/services/` → `server/dao/`. Keep feature business logic in services and Prisma/GitHub access in DAOs.
- Put cross-boundary contracts/data in `shared/`. Nuxt/Nitro auto-imports shared types and values (`Room`, socket events, `prefixLog`) and server utilities (`logger`, `convertConsoleLogToCustomLogger`). Check `.nuxt/types/*imports.d.ts` before adding imports for apparently undefined symbols.
- Task Hold'em is wired in `server/plugins/task-holdem.server.ts`: Socket.IO + Engine.IO at `/api/websocket/task-holdem`, Nitro experimental WebSockets, and the Postgres adapter. The matching client lives in `app/pages/tools/task-holdem/application.client.vue`; event contracts are in `shared/types/task-holdem.type.ts`. Keep the endpoint/contracts synchronized.
- Rooms are persisted as whole JSON payloads in `TaskHoldemRoom.data`, not relational users/votes. The `User` type is still exported by `app/components/task-holdem/CreateUser.vue` and imported as a type by shared/server code.
- History Cleaner only executes workflow-run deletion in `server/services/history-cleaner.service.ts`; `DEPLOYMENTS` exists in the contracts/API but is not implemented in the job flow.
- Site metadata/links live in `nuxt.config.ts` → `runtimeConfig.public`, with version/author/description from `package.json`.

## Releases and deployment

- Conventional Commits drive semantic-release (`.releaserc`); do not manually bump versions in `package.json`/`package-lock.json` or edit `docs/CHANGELOG.md`.
- `.github/workflows/on-pr.yaml` publishes branch-tagged images for same-repository PRs. `.github/workflows/on-release.yaml` publishes release images, but its Kubernetes deployment jobs remain paused with `if: ${{ false }}`.

## Technology documentation (`llms.txt`)

Match examples to the versions in `package.json`/`package-lock.json`, especially Nitro 2, H3 v1, and Prisma 6; unversioned indexes can describe newer majors.

**Verified official `llms.txt` indexes**

- Nuxt: [Nuxt 4 / test-utils](https://nuxt.com/llms.txt), [Nuxt UI](https://ui.nuxt.com/llms.txt), [Nuxt Image](https://image.nuxt.com/llms.txt).
- Vue: [Vue 3](https://vuejs.org/llms.txt), [Vue Router](https://router.vuejs.org/llms.txt), [Unhead](https://unhead.unjs.io/llms.txt).
- Server/data: [Nitro 2](https://v2.nitro.build/llms.txt), [H3 (latest)](https://h3.dev/llms.txt), [Prisma ORM / client](https://www.prisma.io/docs/llms.txt), [Zod](https://zod.dev/llms.txt).
- Runtime/build/tests: [Node.js](https://nodejs.org/llms.txt), [Vite](https://vite.dev/llms.txt), [Vitest / coverage](https://vitest.dev/llms.txt).
- Animation/icons: [GSAP](https://gsap.com/llms.txt), [Lucide](https://lucide.dev/llms.txt).
- Operations: [Docker](https://docs.docker.com/llms.txt), [OpenTelemetry](https://opentelemetry.io/llms.txt), [GitHub REST API / Actions](https://docs.github.com/llms.txt), [semantic-release / plugins](https://semantic-release.gitbook.io/semantic-release/llms.txt).
