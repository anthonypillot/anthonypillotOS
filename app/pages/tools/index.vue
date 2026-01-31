<template>
  <section class="bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:text-center">
        <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Tools</h1>
        <p class="mt-6 text-lg leading-8 text-gray-300">A collection of free and open-source tools to help you with your daily tasks.</p>
      </div>
      <div class="mx-auto mt-16 max-w-2xl lg:max-w-none">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.name"
            :to="tool.to"
            :aria-label="`Go to ${tool.name}`"
            class="flex flex-col bg-white/5 px-6 py-8 ring-1 ring-white/10 sm:rounded-3xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
              <component :is="tool.icon" class="h-6 w-6 flex-none text-indigo-400" aria-hidden="true" />
              {{ tool.name }}
            </dt>
            <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
              <p class="flex-auto">{{ tool.description }}</p>
              <p class="mt-6">
                <span class="text-sm font-semibold leading-6 text-indigo-400 hover:text-indigo-300">
                  Learn more <span aria-hidden="true">→</span>
                </span>
              </p>
            </dd>
          </NuxtLink>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SquaresPlusIcon, ArrowPathRoundedSquareIcon } from "@heroicons/vue/24/outline";

useSeo({
  title: "Tools",
  description: "A collection of free and open-source tools to help you with your daily tasks.",
});

const tools = [
  {
    name: taskHoldemApplication.name,
    description: "Poker planning tool for agile teams following the Scrum framework",
    to: "/tools/task-holdem",
    icon: SquaresPlusIcon,
  },
  {
    name: "GitHub History Cleaner",
    description: "Delete all your GitHub project history (workflow runs, deployments, etc.)",
    to: "/tools/github/history-cleaner",
    icon: ArrowPathRoundedSquareIcon,
  },
];
</script>
