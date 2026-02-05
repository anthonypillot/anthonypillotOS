<template>
  <section class="bg-slate-800 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div
        class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20"
      >
        <div class="w-full flex-auto">
          <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why these choices?</h2>
          <p class="mt-6 text-lg leading-8 text-gray-300">
            Every technology in this stack was chosen with intention. The goal is to build a
            <span class="font-semibold text-indigo-400">performant</span>, <span class="font-semibold text-indigo-400">maintainable</span>,
            and <span class="font-semibold text-indigo-400">scalable</span> application while staying true to open-source values.
          </p>
          <ul class="mt-10 space-y-4 text-base leading-7 text-gray-300">
            <li class="flex gap-x-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-none text-indigo-400" aria-hidden="true" />
              <span
                ><strong class="font-semibold text-white">Type Safety:</strong> TypeScript everywhere for compile-time error catching and
                better developer experience.</span
              >
            </li>
            <li class="flex gap-x-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-none text-indigo-400" aria-hidden="true" />
              <span
                ><strong class="font-semibold text-white">Full-Stack Framework:</strong> Nuxt 4 provides SSR, API routes, and great DX in
                one cohesive package.</span
              >
            </li>
            <li class="flex gap-x-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-none text-indigo-400" aria-hidden="true" />
              <span
                ><strong class="font-semibold text-white">Self-Hosted:</strong> Kubernetes, SigNoz, and Matomo are all self-managed for
                full control and privacy.</span
              >
            </li>
            <li class="flex gap-x-3">
              <CheckCircleIcon class="mt-1 h-5 w-5 flex-none text-indigo-400" aria-hidden="true" />
              <span
                ><strong class="font-semibold text-white">Open Source:</strong> The entire application is open-source, contributions
                welcome on GitHub.</span
              >
            </li>
          </ul>
          <div class="mt-10">
            <a
              :href="githubRepository"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-x-2 rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <NuxtImg class="h-5 w-5" src="svg/icons/github.svg" alt="GitHub" style="filter: invert(1)" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CheckCircleIcon } from "@heroicons/vue/24/outline";

const config = useRuntimeConfig();
const githubRepository = config.public.link.githubRepository;
</script>
