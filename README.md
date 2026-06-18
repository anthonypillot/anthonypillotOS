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

Make sure to install the dependencies:

```bash
npm install
```

> `postinstall` automatically runs `prisma generate && nuxt prepare`.

### Local PostgreSQL

The project uses PostgreSQL (Task Hold'em stores rooms, history-cleaner jobs, feedback and Socket.IO attachments). Start a local container:

```bash
docker run --name postgres \
  -e POSTGRES_USER=anthonypillot \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=anthonypillotOS \
  -v postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres:16-alpine
```

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

> More context for contributors: see [AGENTS.md](AGENTS.md).

## 🧪 Tests

The project uses [Vitest](https://vitest.dev/) for server-side unit tests and [Playwright](https://playwright.dev/) for end-to-end tests.

```bash
npm run test            # Vitest unit tests
npm run test:coverage   # Vitest with v8 coverage
npm run test:e2e        # Playwright (auto-starts npm run start locally)
npm run test:e2e:ui     # Playwright UI mode
```

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
