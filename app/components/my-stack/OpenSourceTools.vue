<template>
  <section class="bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h2 class="text-base font-semibold leading-7 text-indigo-400">Open Source Tools</h2>
        <p class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Built for the community</p>
        <p class="mt-6 text-lg leading-8 text-gray-300">
          Beyond the portfolio, anthonypillotOS hosts open-source tools designed to solve real problems for developers and teams.
        </p>
      </div>

      <div class="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
        <!-- TaskHold'em -->
        <article
          class="flex flex-col items-start justify-between rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:ring-indigo-400/50 transition-all"
        >
          <div class="flex items-center gap-x-4 text-xs">
            <span class="inline-flex items-center rounded-full bg-indigo-400/10 px-3 py-1 text-sm font-medium text-indigo-400"
              >Real-time</span
            >
            <span class="inline-flex items-center rounded-full bg-green-400/10 px-3 py-1 text-sm font-medium text-green-400"
              >WebSocket</span
            >
          </div>
          <div class="group relative mt-4">
            <h3 class="text-lg font-semibold leading-6 text-white group-hover:text-indigo-400">
              <NuxtLink to="/tools/task-holdem">
                <span class="absolute inset-0" />
                TaskHold'em
              </NuxtLink>
            </h3>
            <p class="mt-4 text-sm leading-6 text-gray-300">
              A collaborative poker planning tool for agile teams following the Scrum framework. Real-time voting, instant reveal, and
              seamless team synchronization.
            </p>
          </div>
          <div class="mt-6 flex flex-wrap gap-2">
            <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
              Socket.io
            </span>
            <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
              Vue 3
            </span>
            <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
              PostgreSQL Adapter
            </span>
          </div>
        </article>

        <!-- GitHub History Cleaner -->
        <article
          class="flex flex-col items-start justify-between rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:ring-indigo-400/50 transition-all"
        >
          <div class="flex items-center gap-x-4 text-xs">
            <span class="inline-flex items-center rounded-full bg-indigo-400/10 px-3 py-1 text-sm font-medium text-indigo-400"
              >GitHub API</span
            >
            <span class="inline-flex items-center rounded-full bg-orange-400/10 px-3 py-1 text-sm font-medium text-orange-400"
              >Bulk Operations</span
            >
          </div>
          <div class="group relative mt-4">
            <h3 class="text-lg font-semibold leading-6 text-white group-hover:text-indigo-400">
              <NuxtLink to="/tools/github/history-cleaner">
                <span class="absolute inset-0" />
                GitHub History Cleaner
              </NuxtLink>
            </h3>
            <p class="mt-4 text-sm leading-6 text-gray-300">
              Bulk delete GitHub workflow runs and deployments with ease. Clean up your repository history, free up storage, and maintain a
              tidy project.
            </p>
          </div>
          <div class="mt-6 flex flex-wrap gap-2">
            <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
              GitHub API
            </span>
            <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
              Zod Validation
            </span>
            <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
              Prisma
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
