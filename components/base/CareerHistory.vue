<template>
  <section class="mx-auto max-w-7xl px-6 lg:px-8 lg:max-w-4xl xl:max-w-7xl">
    <h2 class="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">Career history</h2>
    <p class="mt-2 text-lg leading-8 text-gray-400">In the field of the IT world.</p>
    <div class="mt-8 flex flex-col gap-8">
      <article v-for="xp in experiences" :key="xp.title" class="flex flex-col gap-8 md:flex-row">
        <div class="min-w-60 md:w-64 lg:shrink-0">
          <NuxtImg
            :src="xp.imageUrl"
            :alt="xp.title + ' logo'"
            class="p-4 h-full max-h-52 md:max-h-full w-full object-contain rounded-2xl bg-gray-50"
          />
        </div>
        <div>
          <div class="flex items-center gap-x-4 text-xs">
            <div>
              <time class="text-gray-400">{{ xp.date.from }}</time
              ><span class="text-gray-400"> > </span><time class="text-gray-400">{{ xp.date.to }}</time>
            </div>
            <div class="z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-400 hover:bg-gray-100">
              {{ xp.category.title }}
            </div>
          </div>
          <div>
            <h3 class="mt-3 text-lg font-semibold leading-6 text-gray-100">
              {{ xp.title }}
            </h3>
            <span class="mt-5 text-sm leading-6 text-gray-400" v-html="xp.description"></span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
const experiences = [
  {
    title: "ADEO - Leroy Merlin",
    description: `Design of the projects section for the creation and renovation of living spaces in a residence, using estimators and quantity calculation tools, development of qualification and store appointment scheduling pages on the <span class="text-gray-100">Leroy Merlin website (France, Spain, Portugal, Italy, and Poland)</span>.<br>

<p class="text-gray-100">Functional animation, implementation, and support:</p>

- Lead developer in the scope of implementation.<br>
- Communication, facilitation, and inter-team synchronization.<br>
- Participation in the onboarding of various Business Units for the acquisition of new applications.<br>
- Support in bringing various components up to the company's standards.<br>
- Reduction of technical debt and construction of new components.<br>
- Monitoring of quality, performance, deliveries, and production releases.<br>
`,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Leroy_Merlin.svg",
    date: {
      from: "April 2022",
      to: "Now",
    },
    category: { title: "Lead developer - Freelance" },
  },
  {
    title: "Auchan Retail France",
    description: `Dismantling of the <span class="text-gray-100">Web Accounts Repository</span>.<br>

Replacing a legacy monolithic component by optimizing performance, adhering to GDPR standards, and enhancing the security level for accessing customer data.<br>

<p class="text-gray-100">Functional animation and support:</p>

- Facilitating workshops on technical and functional aspects.<br>
- Communication, facilitation, and inter-team synchronization.<br>
- Support in development and testing.<br>
- Technical reference within the scope of implementation.<br>
- Participation in workshops on functional and technical architecture for cross-functional projects.<br>

<p class="text-gray-100">Implementation:</p>

- Development of a REST API in hexagonal architecture, reactive and asynchronous environment.<br>
- Test-driven development (TDD), integration testing, mutation testing.<br>
- Challenging various project teams.<br>
- Securing the API, implementing the OIDC OAuth 2.0 protocol, tracking callers via API Manager (Gravitee).<br>
- Provision and development of comprehensive monitoring (Prometheus, Grafana, ELK Suite).<br>
- Drafting technical and functional specifications.<br>
`,
    imageUrl: "https://upload.wikimedia.org/wikipedia/fr/archive/9/90/20120504132214%21Logo_Auchan_%281983-2015%29.svg",
    date: {
      from: "January 2020",
      to: "April 2022",
    },
    category: { title: "Developer - Mission" },
  },
  {
    title: "Zenika",
    description: `Use and practice of the following technologies:<br/>
  Languages and frameworks: <p class="text-gray-100">JavaScript, TypeScript, Node.js, NestJS, Java, Spring Boot, Vue.js, Nuxt.js.</p>
  Testing: <p class="text-gray-100">Unit test, integration test, end-to-end test using Jest, JUnit5, Cypress.</p>
  Data: <p class="text-gray-100">SQL and NoSQL (PostgreSQL, Google Cloud BigQuery, MongoDB, Azure CosmosDB).</p>
  DevOps: <p class="text-gray-100">Kubernetes, k3s, Rancher, Docker.</p>
  Security: <p class="text-gray-100">JWT management, API Gateway (Gravitee, Kong), OAuth 2.0 OIDC (Keycloak).</p>
  Cloud and serverless: <p class="text-gray-100">Google Cloud, Oracle Cloud Infrastructure (Compute Instance, Autonomous Database).</p>
  Analytics: <p class="text-gray-100">Elastic suite (Elasticsearch, Kibana, Filebeat, APM), Datadog, Prometheus, Grafana.</p>
  Architectural design pattern: <p class="text-gray-100">TDD, MVC, N-tier, Hexagonal.</p>
`,
    imageUrl: "https://zenika-website.cdn.prismic.io/zenika-website/1e2a5d61-1007-4ddb-851a-3cbb14574a3e_Monogramme.svg",
    date: {
      from: "January 2020",
      to: "December 2022",
    },
    category: { title: "IT consultant - CDI" },
  },
];
</script>
