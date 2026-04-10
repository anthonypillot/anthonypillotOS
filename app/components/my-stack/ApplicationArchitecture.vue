<template>
  <section class="bg-slate-800 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h2 class="text-base font-semibold leading-7 text-indigo-400">Application Architecture</h2>
        <p class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Built with modern web technologies</p>
        <p class="mt-6 text-lg leading-8 text-gray-300">
          anthonypillotOS is a full-stack Nuxt 4 application with real-time capabilities, designed for performance, scalability, and
          developer experience.
        </p>
      </div>

      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          <!-- Frontend -->
          <div class="flex flex-col">
            <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                <ComputerDesktopIcon class="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              Frontend
            </dt>
            <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
              <p class="flex-auto">
                <span class="font-semibold text-white">Nuxt 4</span> with Vue 3 Composition API and TypeScript for type-safe, reactive
                interfaces. <span class="font-semibold text-white">Tailwind CSS</span> provides utility-first styling with
                <span class="font-semibold text-white">@headlessui/vue</span> for accessible components.
              </p>
              <div class="mt-6 flex flex-wrap gap-2">
                <a href="https://nuxt.com/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/nuxt.svg" alt="Nuxt 4" />
                  Nuxt 4
                </a>
                <a href="https://vuejs.org/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/vue.svg" alt="Vue 3" />
                  Vue 3
                </a>
                <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/typescript.svg" alt="TypeScript" />
                  TypeScript
                </a>
                <a href="https://tailwindcss.com/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/tailwindcss.svg" alt="Tailwind CSS" />
                  Tailwind CSS
                </a>
              </div>
            </dd>
          </div>

          <!-- Backend -->
          <div class="flex flex-col">
            <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                <ServerIcon class="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              Backend
            </dt>
            <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
              <p class="flex-auto">
                <span class="font-semibold text-white">Nitro</span> server engine powers the API with
                <span class="font-semibold text-white">Socket.io</span> for real-time WebSocket communication.
                <span class="font-semibold text-white">Prisma</span> ORM handles database operations with PostgreSQL.
              </p>
              <div class="mt-6 flex flex-wrap gap-2">
                <a href="https://nitro.unjs.io/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/node.svg" alt="Nitro" />
                  Nitro
                </a>
                <a href="https://www.prisma.io/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/prisma.svg" alt="Prisma" />
                  Prisma
                </a>
                <a href="https://www.postgresql.org/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  <NuxtImg class="h-4 w-4" src="svg/icons/postgresql.svg" alt="PostgreSQL" />
                  PostgreSQL
                </a>
              </div>
            </dd>
          </div>

          <!-- Real-time -->
          <div class="flex flex-col">
            <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                <BoltIcon class="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              Real-time Features
            </dt>
            <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
              <p class="flex-auto">
                <span class="font-semibold text-white">Socket.io</span> with PostgreSQL adapter enables horizontal scaling across multiple
                instances. Perfect for collaborative tools like <span class="font-semibold text-white">TaskHold'em</span>, the poker
                planning application.
              </p>
              <div class="mt-6 flex flex-wrap gap-2">
                <a href="https://socket.io/" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  Socket.io
                </a>
                <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" target="_blank" rel="noopener" class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  WebSockets
                </a>
                <span class="inline-flex items-center gap-x-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
                  Horizontal Scaling
                </span>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BoltIcon, ComputerDesktopIcon, ServerIcon } from "@heroicons/vue/24/outline";
</script>
