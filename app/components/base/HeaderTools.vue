<template>
  <div class="flex flex-col gap-2 p-2">
    <p class="px-3 pb-2 pt-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-toned">Tools</p>
    <NuxtLink
      v-for="tool in tools"
      :key="tool.to"
      :to="tool.to"
      :aria-current="route.path === tool.to ? 'page' : undefined"
      class="group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-elevated/60 motion-reduce:transition-none"
      :class="{ 'bg-primary/12': isActive(tool.to) }"
      @click="emit('navigate')"
    >
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-default bg-elevated/60 text-primary group-hover:bg-primary/15"
      >
        <UIcon :name="tool.icon" class="size-5" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-semibold text-highlighted">{{ tool.name }}</span>
        <span class="mt-1 block text-xs leading-5 text-toned">{{ tool.description }}</span>
      </span>
      <UIcon
        name="i-heroicons-chevron-right"
        class="size-3.5 shrink-0 text-muted group-hover:text-primary"
        aria-hidden="true"
      />
    </NuxtLink>
  </div>
  <div class="border-t border-default p-2">
    <NuxtLink to="/tools" class="header-link justify-between" @click="emit('navigate')">
      <span class="flex items-center gap-2">
        <UIcon name="i-heroicons-squares-2x2" class="size-4 text-primary" aria-hidden="true" />
        View all tools
      </span>
      <UIcon name="i-heroicons-arrow-right" class="size-4 text-primary" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();

const tools = [
  {
    name: taskHoldemApplication.name,
    description: "Planning poker for agile teams",
    to: "/tools/task-holdem",
    icon: "i-heroicons-squares-plus",
  },
  {
    name: itFactsApplication.name,
    description: "Put your IT knowledge to the test",
    to: "/tools/it-facts",
    icon: "i-heroicons-check-badge",
  },
  {
    name: "GitHub History Cleaner",
    description: "Clean up workflow runs and deployments",
    to: "/tools/github/history-cleaner",
    icon: "i-heroicons-arrow-path-rounded-square",
  },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>
