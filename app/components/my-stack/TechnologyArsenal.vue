<template>
  <section class="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
    <!-- Subtle gradient background -->
    <div class="absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-slate-800/50 via-gray-900 to-gray-900" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
    </div>

    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-base font-semibold leading-7 text-indigo-400">And there's</p>
        <h2 class="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">One more thing...</h2>
        <p class="mt-6 text-lg leading-8 text-gray-300">
          Beyond this application, here's my complete technology arsenal. These are all the tools, platforms, and languages I work with
          daily to build, deploy, and maintain modern applications.
        </p>
      </div>

      <!-- Technology Categories -->
      <div class="mx-auto mt-16 max-w-5xl">
        <!-- Languages & Frameworks -->
        <div class="mb-12">
          <h3 class="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-indigo-400">Languages & Frameworks</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-for="tech in techLanguages"
              :key="tech.name"
              :href="tech.url"
              target="_blank"
              rel="noopener"
              class="tech-card group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-indigo-400/50 hover:scale-105"
            >
              <NuxtImg class="h-8 w-8 transition-transform group-hover:scale-110" :src="tech.icon" :alt="tech.name" />
              <span class="text-sm font-medium text-gray-300 group-hover:text-white">{{ tech.name }}</span>
            </a>
          </div>
        </div>

        <!-- Cloud & Infrastructure -->
        <div class="mb-12">
          <h3 class="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-indigo-400">Cloud & Infrastructure</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-for="tech in techCloud"
              :key="tech.name"
              :href="tech.url"
              target="_blank"
              rel="noopener"
              class="tech-card group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-indigo-400/50 hover:scale-105"
            >
              <NuxtImg class="h-8 w-8 transition-transform group-hover:scale-110" :src="tech.icon" :alt="tech.name" />
              <span class="text-sm font-medium text-gray-300 group-hover:text-white">{{ tech.name }}</span>
            </a>
          </div>
        </div>

        <!-- DevOps & Tools -->
        <div class="mb-12">
          <h3 class="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-indigo-400">DevOps & Tools</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-for="tech in techDevOps"
              :key="tech.name"
              :href="tech.url"
              target="_blank"
              rel="noopener"
              class="tech-card group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-indigo-400/50 hover:scale-105"
            >
              <NuxtImg
                class="h-8 w-8 transition-transform group-hover:scale-110"
                :src="tech.icon"
                :alt="tech.name"
                :style="{ filter: tech.invert ? 'invert(1)' : 'none' }"
              />
              <span class="text-sm font-medium text-gray-300 group-hover:text-white">{{ tech.name }}</span>
            </a>
          </div>
        </div>

        <!-- Monitoring & Analytics -->
        <div class="mb-12">
          <h3 class="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-indigo-400">Monitoring & Analytics</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-for="tech in techMonitoring"
              :key="tech.name"
              :href="tech.url"
              target="_blank"
              rel="noopener"
              class="tech-card group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-indigo-400/50 hover:scale-105"
            >
              <NuxtImg class="h-8 w-8 transition-transform group-hover:scale-110" :src="tech.icon" :alt="tech.name" />
              <span class="text-sm font-medium text-gray-300 group-hover:text-white">{{ tech.name }}</span>
            </a>
          </div>
        </div>

        <!-- Operating Systems -->
        <div class="mb-12">
          <h3 class="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-indigo-400">Operating Systems</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-for="tech in techOS"
              :key="tech.name"
              :href="tech.url"
              target="_blank"
              rel="noopener"
              class="tech-card group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-indigo-400/50 hover:scale-105"
            >
              <NuxtImg class="h-8 w-8 transition-transform group-hover:scale-110" :src="tech.icon" :alt="tech.name" />
              <span class="text-sm font-medium text-gray-300 group-hover:text-white">{{ tech.name }}</span>
            </a>
          </div>
        </div>

        <!-- Design & Productivity -->
        <div>
          <h3 class="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-indigo-400">Design & Productivity</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-for="tech in techDesign"
              :key="tech.name"
              :href="tech.url"
              target="_blank"
              rel="noopener"
              class="tech-card group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-indigo-400/50 hover:scale-105"
            >
              <NuxtImg class="h-8 w-8 transition-transform group-hover:scale-110" :src="tech.icon" :alt="tech.name" />
              <span class="text-sm font-medium text-gray-300 group-hover:text-white">{{ tech.name }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Closing statement -->
      <div class="mx-auto mt-20 max-w-2xl text-center">
        <p class="text-lg leading-8 text-gray-400">
          <span class="text-white font-semibold">{{ totalTechnologies }}</span> technologies.
          <span class="text-white font-semibold">One</span> passion.
          <span class="text-indigo-400 font-semibold">Endless</span> possibilities.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Technology data with links
const techLanguages = [
  { name: "TypeScript", icon: "svg/icons/typescript.svg", url: "https://www.typescriptlang.org/" },
  { name: "JavaScript", icon: "svg/icons/javascript.svg", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { name: "Vue.js", icon: "svg/icons/vue.svg", url: "https://vuejs.org/" },
  { name: "Nuxt", icon: "svg/icons/nuxt.svg", url: "https://nuxt.com/" },
  { name: "Node.js", icon: "svg/icons/node.svg", url: "https://nodejs.org/" },
  { name: "Golang", icon: "svg/icons/golang.svg", url: "https://go.dev/" },
  { name: "Java", icon: "svg/icons/java.svg", url: "https://www.java.com/" },
  { name: "Tailwind CSS", icon: "svg/icons/tailwindcss.svg", url: "https://tailwindcss.com/" },
];

const techCloud = [
  { name: "Kubernetes", icon: "svg/icons/kubernetes.svg", url: "https://kubernetes.io/" },
  { name: "Docker", icon: "svg/icons/docker.svg", url: "https://www.docker.com/" },
  { name: "Azure", icon: "svg/icons/azure.svg", url: "https://azure.microsoft.com/" },
  { name: "Google Cloud", icon: "svg/icons/gcp.svg", url: "https://cloud.google.com/" },
  { name: "Terraform", icon: "svg/icons/terraform.svg", url: "https://www.terraform.io/" },
  { name: "Proxmox", icon: "svg/icons/proxmox.svg", url: "https://www.proxmox.com/" },
];

const techDevOps = [
  { name: "Git", icon: "svg/icons/git.svg", url: "https://git-scm.com/" },
  { name: "GitHub", icon: "svg/icons/github.svg", invert: true, url: "https://github.com/" },
  { name: "GitLab", icon: "svg/icons/gitlab.svg", url: "https://gitlab.com/" },
  { name: "Ansible", icon: "svg/icons/ansible.svg", url: "https://www.ansible.com/" },
  { name: "Prisma", icon: "svg/icons/prisma.svg", url: "https://www.prisma.io/" },
  { name: "PostgreSQL", icon: "svg/icons/postgresql.svg", url: "https://www.postgresql.org/" },
  { name: "Vault", icon: "svg/icons/vault.svg", url: "https://www.vaultproject.io/" },
  { name: "Bitwarden", icon: "svg/icons/bitwarden.svg", url: "https://bitwarden.com/" },
];

const techMonitoring = [
  { name: "SigNoz", icon: "svg/icons/signoz.svg", url: "https://signoz.io/" },
  { name: "Matomo", icon: "svg/icons/matomo.svg", url: "https://matomo.org/" },
  { name: "Datadog", icon: "svg/icons/datadog.svg", url: "https://www.datadoghq.com/" },
  { name: "Grafana", icon: "svg/icons/grafana.svg", url: "https://grafana.com/" },
  { name: "Elastic", icon: "svg/icons/elastic.svg", url: "https://www.elastic.co/" },
  { name: "BigQuery", icon: "svg/icons/bigquery.svg", url: "https://cloud.google.com/bigquery" },
];

const techOS = [
  { name: "Linux", icon: "svg/icons/linux.svg", url: "https://www.linux.org/" },
  { name: "Ubuntu", icon: "svg/icons/ubuntu.svg", url: "https://ubuntu.com/" },
  { name: "Windows", icon: "svg/icons/windows.svg", url: "https://www.microsoft.com/windows" },
];

const techDesign = [{ name: "Figma", icon: "svg/icons/figma.svg", url: "https://www.figma.com/" }];

const totalTechnologies = computed(() =>
  [techLanguages, techCloud, techDevOps, techMonitoring, techOS, techDesign].reduce((sum, arr) => sum + arr.length, 0)
);
</script>

<style scoped>
.tech-card {
  backdrop-filter: blur(8px);
}
</style>
