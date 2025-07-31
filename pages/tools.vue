<template>
  <div class="bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Tools</h1>
        <p class="mt-6 text-lg leading-8 text-gray-300">
          Explore our collection of open-source tools designed to enhance your development workflow.
        </p>
      </div>
      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <div
            v-for="tool in tools"
            :key="tool.id"
            class="group relative flex flex-col gap-6 rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 transition-all"
          >
            <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
              <component
                :is="tool.icon"
                class="h-7 w-7 flex-none text-indigo-400"
                aria-hidden="true"
              />
              {{ tool.name }}
            </dt>
            <dd class="flex flex-auto flex-col text-base leading-7 text-gray-300">
              <p class="flex-auto">{{ tool.description }}</p>
              <p class="mt-6">
                <NuxtLink
                  :to="tool.href"
                  class="text-sm font-semibold leading-6 text-indigo-400 hover:text-indigo-300"
                >
                  Launch {{ tool.name }} <span aria-hidden="true">→</span>
                </NuxtLink>
              </p>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tools } from "@/types/tools.type";

useSeo({
  title: "Tools",
  description: "Explore our collection of open-source tools designed to enhance your development workflow.",
});
</script>