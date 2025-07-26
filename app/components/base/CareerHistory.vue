<template>
  <section class="flex flex-col gap-8">
    <BaseExperienceCard v-for="experience in experiences" :key="experience.company.name" :experience="experience" />
  </section>
</template>

<script setup lang="ts">
import type { Experience } from "@/components/base/ExperienceCard.vue";

const config = useRuntimeConfig();

const logo = config.app.website.logo.os.raw;

const os: Experience = {
  company: {
    name: "anthonypillotOS",
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
    "<p>Development of a personal project, anthonypillotOS, a website dedicated to my professional career and personal projects.</p><p>Design and development of the website, including the creation of a documentation section and some tools.</p><p>Implementation of a CI/CD pipeline for automatic deployment on my Kubernetes cluster.</p><p>Integration of various tools for monitoring and analytics.</p>",
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
    "<p>Design of the projects section for the creation and renovation of living spaces in a residence, using estimators and quantity calculation tools, development of qualification and store appointment scheduling pages and journeys on the Leroy Merlin website (France, Spain, Portugal, Italy, and Poland).</p><p>Functional animation, implementation, and support:</p>Development of an integrated solution enabling various Business Units to independently create scheduling and estimation journeys.<br/>Participation in the onboarding of various Business Units for the acquisition of new applications.<br/>Lead developer in the scope of implementation.<br/>Support in bringing various components up to the company's standards.<br/>Reduction of technical debt and construction of new components.<br/>Monitoring of quality, performance, deliveries, and production releases.<br/>Conduct workshops on architecture and design between teams.<br/>Facilitate the implementation and introduce the concept of innersourcing.<br/>",
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
    testing: ["Unit tests", "Integration testing", "End-to-end testing", "Vitest", "JUnit", "Cerberus", "Cypress", "Playwright"],
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
    "<p>Dismantling of Auchan Retail France's Web Accounts Repository.</p><p>Replacing a legacy monolithic component by optimizing performance, adhering to GDPR standards, and enhancing the security level for accessing customer data.</p><p>Functional animation and support:</p>Facilitating workshops on technical and functional aspects.<br/>Communication, facilitation, and inter-team synchronization.<br/>Support in development and testing.<br/>Technical reference within the scope of implementation.<br/>Participation in workshops on functional and technical architecture for cross-functional projects.<br/><p>Implementation:</p>Development of a REST API in hexagonal architecture, reactive and asynchronous environment.<br/>Test-driven development (TDD), unit, integration and mutation testing.<br/>Ensure API security, implement the OIDC OAuth 2.0 authorization protocol, and configure access using Gravitee's API Manager/Gateway.<br/>Provision and development of comprehensive monitoring (Prometheus, Grafana, ELK Suite).<br/>Drafting technical and functional specifications.<br/>Challenging various project teams.<br/>Scale the database and implement other performance enhancements in the API.<br/>",
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
    "<p>IT consulting firm specializing in helping companies with their digital transformation.</p><p>At Zenika, a commitment to excellence is matched by a passion for innovation. They leverage cutting-edge technologies and methodologies to deliver impactful results that drive business growth and efficiency. From developing custom applications to providing strategic consulting services, Zenika partners with clients across diverse industries to transform challenges into opportunities.</p><p>During my three-year tenure at Zenika, I experienced a profoundly enriching journey that left an indelible mark on both my professional and personal growth. Surrounded by some of the best minds in the industry, I was guided with exceptional well-being and support every step of the way. Each day brought new lessons and opportunities for learning, making every moment at Zenika both inspiring and transformative.</p>",
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

const experiences = ref<Experience[]>([os, adeo, auchan, zenika]);
</script>
