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

- Vitest uses the Nuxt environment and discovers tests under `server/` and `layers/*/tests/unit/`; UI tests use Playwright. Keep `vitest.config.ts`'s `h3Version: 1` pin to match Nitro 2 despite transitive H3 v2 tooling.
- Service tests mock DAOs; GitHub DAO tests use MSW with unhandled requests treated as errors. Keep DB/GitHub interactions mocked rather than using live credentials.
- Playwright always starts the built Nitro server at `http://127.0.0.1:4173`, locally and in CI. Run `npm run build` before direct `npx playwright test` commands; `npm run test:e2e` builds first. CI runs on schedule/manual dispatch only.
- E2E uses the dedicated `os-e2e-postgres` Docker container (`os_e2e_postgres` database) on port `55439`, never `.env` credentials. Fixtures block unmocked History Cleaner requests; multiplayer fixtures close contexts and delete only their test-owned rooms.
- The default Playwright run covers six desktop/tablet/mobile projects; use the focused Chromium command above for a quick check. Install browsers with `npx playwright install --with-deps` when needed.

## Wiring and boundaries

- Feature flow: HTTP handlers or socket plugins → services → DAOs. Keep feature business logic in services and Prisma/GitHub access in DAOs.
- Put cross-boundary contracts/data in `shared/`. Nuxt/Nitro auto-imports shared types and values and server utilities (`logger`, `convertConsoleLogToCustomLogger`). Check `.nuxt/types/*imports.d.ts` before adding imports for apparently undefined symbols.
- Task Hold'em lives in the auto-registered Nuxt layer `layers/task-holdem/`, including `app/`, `server/`, `shared/`, `public/` and `tests/`. Prisma and reusable infrastructure remain at the project root. Run its tests with `npx vitest run layers/task-holdem/tests/unit` or, after building, `npx playwright test layers/task-holdem/tests/e2e --project="Desktop - Chromium"`.
- Task Hold'em uses versioned commands at `/api/websocket/task-holdem`: the layer's Nitro plugin bootstraps Socket.IO/Engine.IO and the Postgres adapter; its `server/realtime/task-holdem.ts` validates commands and delegates to services/domain rules. Contracts and Zod schemas live in its `shared/`, never in Vue components. The page consumes `useTaskHoldemRoom`, which owns socket cleanup and recovery. Use relative imports within the layer; `#server` and `#shared` refer to project-root infrastructure.
- Task Hold'em room JSON is mutated under a PostgreSQL row lock with a monotonic revision. `TaskHoldemConnection` stores expiring presence leases separately. Never write room state or renew leases outside the DAO's locked mutation path. Credentials never appear in public projections; other participants' votes appear only after reveal. The private view includes the participant's own vote. `TASK_HOLDEM_GRACE_MS` and `TASK_HOLDEM_REVEAL_MS` configure server timing.
- Task Hold'em topics lock when reveal starts. Completed rounds are archived in `TaskHoldemRound` in the same locked transaction as reveal completion, including overdue reveals immediately followed by a restart. Read history through the authenticated, paginated `room:history` command; never include unrevealed votes or connection credentials. Chat stays ephemeral. Sound mute is device-local; request native notification permission only from an explicit join/create action, never automatic readmission. The scoped notification service worker has no cache or push subscriptions.
- History Cleaner only executes workflow-run deletion in `server/services/history-cleaner.service.ts`; `DEPLOYMENTS` exists in the contracts/API but is not implemented in the job flow.
- Site metadata/links live in `nuxt.config.ts` → `runtimeConfig.public`, with version/author/description from `package.json`.
- The site is dark-only: keep the root `dark` class and `ui.colorMode: false` in `nuxt.config.ts`. Use Nuxt UI semantic color tokens for interface elements; reserve fixed colors for illustrations.

## Releases and deployment

- Conventional Commits drive semantic-release (`.releaserc`); do not manually bump versions in `package.json`/`package-lock.json` or edit `docs/CHANGELOG.md`.
- `.github/workflows/on-pr.yaml` publishes branch-tagged images for same-repository PRs. `.github/workflows/on-release.yaml` publishes release images, but its Kubernetes deployment jobs remain paused with `if: ${{ false }}`.

## Technology documentation (`llms.txt`)

Match examples to the versions in `package.json`/`package-lock.json`, especially Nitro 2, H3 v1, and Prisma 7; unversioned indexes can describe newer majors.

**Verified official `llms.txt` indexes**

- Nuxt: [Nuxt 4 / test-utils](https://nuxt.com/llms.txt), [Nuxt UI](https://ui.nuxt.com/llms.txt), [Nuxt Image](https://image.nuxt.com/llms.txt).
- Vue: [Vue 3](https://vuejs.org/llms.txt), [Vue Router](https://router.vuejs.org/llms.txt), [Unhead](https://unhead.unjs.io/llms.txt).
- Server/data: [Nitro 2](https://v2.nitro.build/llms.txt), [H3 (latest)](https://h3.dev/llms.txt), [Prisma ORM / client](https://www.prisma.io/docs/llms.txt), [Zod](https://zod.dev/llms.txt).
- Runtime/build/tests: [Node.js](https://nodejs.org/llms.txt), [Vite](https://vite.dev/llms.txt), [Vitest / coverage](https://vitest.dev/llms.txt).
- Animation/icons: [GSAP](https://gsap.com/llms.txt), [Lucide](https://lucide.dev/llms.txt).
- Operations: [Docker](https://docs.docker.com/llms.txt), [OpenTelemetry](https://opentelemetry.io/llms.txt), [GitHub REST API / Actions](https://docs.github.com/llms.txt), [semantic-release / plugins](https://semantic-release.gitbook.io/semantic-release/llms.txt).
