<template>
  <section class="tools-showcase relative isolate overflow-hidden bg-gray-900 px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
    <div class="mx-auto max-w-6xl">
      <div class="mx-auto max-w-2xl text-center">
        <p class="inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3.5 py-1.5 text-xs font-medium text-indigo-200">
          <UIcon name="i-heroicons-code-bracket" class="size-4" aria-hidden="true" />
          Free &amp; open source
        </p>
        <h1 class="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">Tools</h1>
        <p class="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">{{ description }}</p>
      </div>
      <ul aria-label="Available tools" class="mx-auto mt-12 grid max-w-lg grid-cols-1 gap-6 sm:mt-16 lg:max-w-none lg:grid-cols-3">
        <li v-for="tool in tools" :key="tool.id" class="min-w-0">
          <ToolsToolCard :tool="tool" />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Tool } from "~/types/tool.type";

const description = "Plan with your team, put your IT knowledge to the test, or tidy up GitHub.";

useSeo({
  title: "Tools",
  description,
});

const tools = [
  {
    id: "task-holdem",
    name: taskHoldemApplication.name,
    category: "Team collaboration",
    description: "Run real-time planning poker sessions and estimate work together.",
    to: "/tools/task-holdem",
    icon: "i-heroicons-squares-plus",
  },
  {
    id: "it-facts",
    name: itFactsApplication.name,
    category: "Knowledge & play",
    description: "Test your IT knowledge with a quick true-or-false challenge.",
    to: "/tools/it-facts",
    icon: "i-heroicons-check-badge",
  },
  {
    id: "history-cleaner",
    name: "GitHub History Cleaner",
    category: "Repository maintenance",
    description: "Bulk-delete GitHub workflow runs and deployments from your repositories.",
    to: "/tools/github/history-cleaner",
    icon: "i-heroicons-arrow-path-rounded-square",
  },
] satisfies Tool[];
</script>

<style scoped>
.tools-showcase::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% 10%, rgb(99 102 241 / 12%), transparent 65%);
  content: "";
  pointer-events: none;
}
</style>
