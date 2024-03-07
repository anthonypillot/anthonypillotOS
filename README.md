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
  - [🧪 Unit tests](#-unit-tests)
  - [🚀 Production](#-production)
    - [Local preview](#local-preview)
    - [Docker image](#docker-image)
- [🚀 Deployment](#-deployment)
- [📈 Performance](#-performance)
- [🌳 Git conventions](#-git-conventions)
- [📜 License](#-license)

## ⚙️ Setup

Make sure to install the dependencies:

```bash
npm install
```

## 🚧 Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## 🧪 Unit tests

The project uses [Vitest](https://vitest.dev/) for unit tests.

Run the unit tests:

```bash
npm run test:unit
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

# 🚀 Deployment

This application is deployed on [anthonypillot.com](https://anthonypillot.com) Kubernetes cluster.

# 📈 Performance

This application uses **Elastic APM** to collect performance metrics.

# 🌳 Git conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) to make commits more readable and easier to understand.

# 📜 License

This project is licensed under the [GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/).
