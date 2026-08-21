<template>
  <section class="mx-auto w-full max-w-7xl overflow-x-clip px-3 sm:px-6 lg:px-8" aria-label="Career history">
    <header class="mb-10 sm:mb-12">
      <h2 class="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">Career history</h2>
      <p class="mt-2 text-base leading-7 text-gray-200 sm:text-lg sm:leading-8">
        The roles, missions, and projects that shaped my career.
      </p>
    </header>

    <ol class="career-timeline relative flex flex-col gap-10 sm:gap-14">
      <li
        v-for="experience in experiences"
        :key="experience.company.name"
        class="grid grid-cols-1 items-start sm:grid-cols-[8rem_2.5rem_minmax(0,1fr)] lg:grid-cols-[10rem_3.5rem_minmax(0,1fr)]"
      >
        <p class="hidden pt-12 text-right text-sm font-medium uppercase tracking-wider text-indigo-300 sm:block">
          <span class="block">{{ experience.period.from }}</span>
          <span class="mt-1 block" :class="experience.period.to === 'Now' ? 'text-emerald-300' : 'text-gray-400'">
            {{ experience.period.to }}
          </span>
        </p>

        <div class="relative z-10 hidden justify-center pt-13 sm:flex">
          <span class="timeline-node" aria-hidden="true" />
        </div>

        <div class="min-w-0 sm:ml-4">
          <BaseExperienceCard :experience="experience" />
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { Experience } from "@/components/base/ExperienceCard.vue";

const config = useRuntimeConfig();

const logo = config.public.logo.os.raw;

const claim: Experience = {
  company: {
    name: "Claim",
    website: "https://claim.anthonypillot.com",
    logo: {
      url: "/svg/logos/claim.svg",
      alt: "Claim logo",
    },
  },
  period: {
    from: "June 2026",
    to: "Now",
  },
  role: "Full Stack Developer - Freelance",
  description:
    "An open-source platform that aggregates currently free game giveaways from Epic Games, Prime Gaming, GOG, and Steam through a public API and web application.",
  highlights: [
    { label: "Multi-store giveaway aggregation", icon: "i-heroicons-gift" },
    { label: "Resilient read-through cache and public API", icon: "i-heroicons-circle-stack" },
    { label: "Web application and Kubernetes delivery", icon: "i-heroicons-cloud-arrow-up" },
  ],
  technology: {
    language: ["TypeScript", "Bun"],
    backend: ["Elysia"],
    frontend: ["SvelteKit", "Svelte 5", "Tailwind CSS", "shadcn-svelte"],
    testing: ["Bun test", "Vitest", "Playwright"],
    data: ["PostgreSQL 18", "Drizzle ORM", "PGlite"],
    devops: ["Docker", "Kubernetes"],
    cicd: ["GitHub Actions", "Semantic Release"],
    analytics: ["Plausible"],
    architecture: ["Feature-based", "Monorepo", "Read-through cache"],
  },
};

const os: Experience = {
  company: {
    name: "anthonypillotOS",
    website: "https://anthonypillot.com",
    logo: {
      url: logo,
      alt: "anthonypillotOS logo",
    },
  },
  period: {
    from: "January 2020",
    to: "Now",
  },
  role: "Full Stack Developer - Freelance",
  description:
    "A personal website presenting my professional career and projects, with documentation and IT tools, automated Kubernetes deployment, monitoring, and analytics.",
  highlights: [
    { label: "Product and tool development", icon: "i-heroicons-code-bracket" },
    { label: "Kubernetes CI/CD deployment", icon: "i-heroicons-cloud-arrow-up" },
    { label: "Monitoring and analytics integration", icon: "i-heroicons-chart-bar" },
  ],
  technology: {
    language: ["JavaScript", "TypeScript", "Node.js 18", "Node.js 20", "Node.js 22"],
    backend: ["Fastify", "Express.js", "NestJS"],
    frontend: ["Nuxt", "Vue.js", "Tailwind CSS"],
    testing: ["Vitest", "Playwright"],
    data: ["PostgreSQL"],
    devops: ["Kubernetes", "k3s", "Docker"],
    cicd: ["GitHub Actions"],
    security: ["GitHub Advanced Security"],
    cloud: ["Oracle Cloud (Compute Instance)"],
    analytics: ["SigNoz", "Matomo"],
    ide: ["Visual Studio Code"],
    architecture: ["Layered / N-Tier"],
  },
};

const adeo: Experience = {
  company: {
    name: "ADEO",
    website: "https://www.adeo.com",
    logo: {
      url: "svg/logos/adeo.svg",
      alt: "ADEO logo",
    },
  },
  period: {
    from: "April 2022",
    to: "Now",
  },
  role: "IT Consultant - Freelance",
  description:
    "Designed and developed Leroy Merlin project, qualification, estimation, and store-appointment journeys for France, Spain, Portugal, Italy, and Poland.",
  highlights: [
    { label: "Scheduling and estimation journeys", icon: "i-heroicons-code-bracket" },
    { label: "Business Unit onboarding and implementation leadership", icon: "i-heroicons-user-group" },
    { label: "Quality, architecture, and innersourcing", icon: "i-heroicons-wrench-screwdriver" },
  ],
  technology: {
    language: [
      "Node.js 16",
      "Node.js 18",
      "Node.js 20",
      "Node.js 22",
      "Java 17",
      "Java 21",
      "Golang 1.20",
      "Golang 1.21",
      "Golang 1.22",
      "Golang 1.23",
    ],
    backend: ["NestJS", "Spring Webflux", "Fastify"],
    frontend: ["Nuxt", "Vue.js", "Freemarker"],
    testing: [
      "Unit tests",
      "Integration testing",
      "End-to-end testing",
      "Vitest",
      "JUnit",
      "Cerberus",
      "Cypress",
      "Playwright",
    ],
    data: ["PostgreSQL", "BigQuery"],
    devops: ["Terraform", "Kubernetes", "Docker"],
    cicd: ["GitHub Actions", "GitLab CI", "CircleCI"],
    security: ["JWT management", "API Gateway", "OAuth 2.0 OIDC", "GitHub Advanced Security"],
    cloud: ["Google Cloud (Compute Engine, GKE, Cloud Run, BigQuery)"],
    analytics: ["Datadog"],
    ide: ["Visual Studio Code"],
    architecture: ["Layered / N-Tier", "Modular"],
  },
};

const auchan: Experience = {
  company: {
    name: "Auchan",
    website: "https://www.auchan-retail.com",
    logo: {
      url: "svg/logos/auchan.svg",
      alt: "Auchan logo",
    },
  },
  period: {
    from: "April 2020",
    to: "April 2022",
  },
  role: "IT Consultant - Mission",
  description:
    "Helped dismantle Auchan Retail France's Web Accounts Repository by replacing a legacy monolithic component with a more performant, GDPR-aligned, and secure customer-data solution.",
  highlights: [
    { label: "Cross-team functional and technical coordination", icon: "i-heroicons-user-group" },
    { label: "Hexagonal REST API implementation and testing", icon: "i-heroicons-command-line" },
    { label: "Security, performance, and observability", icon: "i-heroicons-shield-check" },
  ],
  technology: {
    language: ["Java 11", "Java 17"],
    backend: ["Spring Webflux"],
    testing: ["TDD", "Unit testing", "Integration testing", "Mutation testing", "JUnit5"],
    data: ["Azure CosmosDB (NoSQL)"],
    devops: ["Kubernetes", "Docker", "Rancher"],
    cicd: ["GitLab CI"],
    security: ["JWT management", "API Gateway (Gravitee)", "OAuth 2.0 OIDC (Keycloak)"],
    cloud: ["Azure"],
    analytics: ["Elasticsearch", "Kibana", "Filebeat", "APM", "Prometheus", "Grafana"],
    ide: ["IntelliJ IDEA Ultimate"],
    architecture: ["TDD", "Hexagonal"],
  },
};

const zenika: Experience = {
  company: {
    name: "Zenika",
    website: "https://www.zenika.com",
    logo: {
      url: "svg/logos/zenika.svg",
      alt: "Zenika logo",
    },
  },
  period: {
    from: "January 2020",
    to: "December 2022",
  },
  role: "IT Consultant - CDI",
  description:
    "A three-year tenure at a digital-transformation consultancy, shaped by an innovative, supportive environment and continuous professional and personal learning.",
  highlights: [
    { label: "Digital transformation consulting", icon: "i-heroicons-briefcase" },
    { label: "Innovation and modern technologies", icon: "i-heroicons-light-bulb" },
    { label: "Learning and professional growth", icon: "i-heroicons-academic-cap" },
  ],
  technology: {
    language: ["JavaScript", "TypeScript", "Java 11", "Java 17"],
    backend: ["Spring Boot", "Spring Webflux", "NestJS", "Express.js"],
    frontend: ["Vue.js", "Nuxt.js"],
    testing: ["Unit test", "Integration test", "End-to-end test", "Jest", "JUnit5", "Cypress"],
    data: ["PostgreSQL", "Google Cloud BigQuery", "MongoDB", "Azure CosmosDB"],
    devops: ["Kubernetes", "k3s", "Rancher", "Docker"],
    cicd: ["GitHub Actions", "GitLab CI", "Circle CI"],
    security: ["JWT management", "API Gateway (Gravitee, Kong)", "OAuth 2.0 OIDC (Keycloak)"],
    cloud: [
      "Google Cloud (Compute Engine, GKE, Cloud Run, BigQuery)",
      "Azure",
      "Oracle Cloud Infrastructure (Compute Instance, Autonomous Database)",
    ],
    analytics: ["Elasticsearch", "Kibana", "Filebeat", "APM", "Datadog", "Prometheus", "Grafana"],
    ide: ["VisualStudio Code", "IntelliJ IDEA Ultimate"],
    architecture: ["TDD", "Layered / N-Tier", "Hexagonal"],
  },
};

const experiences = ref<Experience[]>([claim, adeo, os, auchan, zenika]);
</script>

<style scoped>
.career-timeline::before {
  display: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(0.75rem - 1px);
  width: 2px;
  content: "";
  background: linear-gradient(
    to bottom,
    transparent,
    rgb(99 102 241 / 45%) 4rem,
    rgb(71 85 105 / 55%) 95%,
    transparent
  );
}

.timeline-node {
  width: 1rem;
  height: 1rem;
  border: 3px solid rgb(165 180 252 / 65%);
  border-radius: 9999px;
  background: white;
  box-shadow:
    0 0 0 0.5rem rgb(99 102 241 / 22%),
    0 0 1.5rem 0.5rem rgb(99 102 241 / 45%);
}

@media (min-width: 640px) {
  .career-timeline::before {
    display: block;
    left: calc(8rem + 1.25rem - 1px);
  }

  .timeline-node {
    width: 1.25rem;
    height: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .career-timeline::before {
    left: calc(10rem + 1.75rem - 1px);
  }
}
</style>
