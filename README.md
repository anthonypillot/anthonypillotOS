<div align="center">

<img src="https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_black.svg" alt="logo_anthonypillotOS_black" width="250"/>
<img src="https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_white.svg" alt="logo_anthonypillotOS_black" width="250"/>

# [anthonypillotOS](https://anthonypillot.com) | Personal application

</div>

👨🏻‍💻 The Operating System by Anthony Pillot, Software Engineer, designed to introduce himself and explain what he does in the IT world. Provided with Open Source tools and documentation about the IT world.

Build with ❤️ and [Nuxt](https://nuxt.com).

# Table of Contents

- [anthonypillotOS | Personal application](#anthonypillotos--personal-application)
- [Table of Contents](#table-of-contents)
  - [⚙️ Setup](#️-setup)
  - [🚧 Development](#-development)
  - [🧪 Tests](#-tests)
  - [🚀 Production](#-production)
    - [Local preview](#local-preview)
    - [Docker image](#docker-image)
  - [🛠️ Linting & type checking](#️-linting--type-checking)
- [🚀 Deployment](#-deployment)
- [🌳 Git conventions](#-git-conventions)
- [📜 License](#-license)

## ⚙️ Setup

Use Node.js 24.15 or newer within the 24.x release line and npm:

```bash
npm install
```

> `postinstall` automatically runs `nuxt prepare && prisma generate`.
> Prisma CLI loads `POSTGRES_PRISMA_URL` from `.env` through `prisma.config.ts`; client generation does not need a running database.

### Local PostgreSQL

The project uses PostgreSQL 18 for Task Hold'em rooms, history-cleaner jobs, feedback and Socket.IO attachments. Start a local container:

```bash
docker run --name os-postgres \
  -e POSTGRES_USER=anthonypillot \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=anthonypillotOS \
  -v postgres-18-data:/var/lib/postgresql \
  -p 5432:5432 \
  -d postgres:18-alpine
```

> PostgreSQL 18 mounts its data volume at `/var/lib/postgresql`. Use a fresh volume; migrate older local databases with `pg_dump`/`pg_restore` or `pg_upgrade` rather than reusing their data directories directly.

Then copy `.env.example` to `.env` and fill in `POSTGRES_PRISMA_URL`:

```bash
cp .env.example .env
```

Set up your database:

```bash
# First-time setup:
npx prisma db push

# Or for existing setups:
npx prisma migrate dev
```

## 🚧 Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

Task Hold'em is grouped in `layers/task-holdem/`: app, server, shared contracts, public assets and tests. Nuxt registers this local layer automatically; Prisma and shared infrastructure stay at the project root.

> More context for contributors: see [AGENTS.md](AGENTS.md).

## 🧪 Tests

The project uses [Vitest](https://vitest.dev/) for server-side unit tests and [Playwright](https://playwright.dev/) for end-to-end tests.

```bash
npm run test             # Vitest unit tests
npm run test:coverage    # Vitest with v8 coverage
npm run test:e2e:db:up   # Start disposable Docker PostgreSQL and initialize its schema
npm run test:e2e         # Build once, then run all six Playwright browser/device projects
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:db:down # Stop and discard the E2E database
```

E2E tests always launch the production build at `http://127.0.0.1:4173`, including in CI.
Their dedicated database uses port `55439` and never reads database credentials from `.env`.
Install browsers once with `npx playwright install --with-deps`.

For a quick check, use `npm run test:e2e -- --project="Desktop - Chromium"`.
After building, `npx playwright test ...` reruns selected specs without rebuilding.
`npm run test:e2e:typecheck` and `npm run test:e2e:list` check types/discovery without starting the app or database.

GitHub Actions runs E2E only on the weekly schedule or manual dispatch, grouped by browser engine.
Failures fail the workflow; artifacts include HTML/JUnit reports, failure screenshots/traces, browser diagnostics, and `logs/e2e-server.log`.
TaskHold'em exercises real WebSockets/PostgreSQL, including two Nitro instances for concurrent-command tests. History Cleaner submissions are mocked with fake tokens and blocked unless explicitly intercepted.
Do not run builds and Playwright simultaneously: `npm run build` removes previous reports and test results.

## 🚀 Production

### Local preview

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Shortcut to build and preview production build:

```bash
npm run start
```

### Docker image

Local Docker image build and run:

```bash
docker build --no-cache -t os:latest . \
&& docker run --rm --name=os -p 3000:3000 os:latest
```

The image is multi-stage (`node:24` builder → `gcr.io/distroless/nodejs24-debian13` runtime) and exposes port 3000. Pass `GIT_SHA` as a build arg to surface the commit in `/api` and the startup logs.

## 🛠️ Linting & type checking

```bash
npm run lint            # nuxt typecheck && eslint .
```

# 🚀 Deployment

This application is deployed on [anthonypillot.com](https://anthonypillot.com) Kubernetes cluster.

# 🌳 Git conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) to make commits more readable and easier to understand.

# 📜 License

This project is licensed under the [GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/).
