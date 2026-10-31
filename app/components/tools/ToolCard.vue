<template>
  <NuxtLink
    :to="tool.to"
    :aria-labelledby="`${tool.id}-title`"
    :aria-describedby="`${tool.id}-description`"
    class="tool-card group flex h-full flex-col rounded-3xl border border-default bg-elevated/60 p-2"
  >
    <ToolsToolPreview :tool-id="tool.id" />
    <div class="flex flex-1 flex-col px-4 pb-4 pt-6 sm:px-5 sm:pb-5">
      <p class="flex items-center gap-2 text-xs font-medium text-primary">
        <UIcon :name="tool.icon" class="size-4 shrink-0" aria-hidden="true" />
        {{ tool.category }}
      </p>
      <h2 :id="`${tool.id}-title`" class="mt-3 text-xl font-semibold leading-7 tracking-tight text-highlighted">{{ tool.name }}</h2>
      <p :id="`${tool.id}-description`" class="mt-3 flex-1 text-sm leading-7 text-toned">{{ tool.description }}</p>
      <div class="mt-7 flex items-center justify-between border-t border-default pt-4 text-sm font-semibold text-primary">
        <span>Explore tool</span>
        <span class="flex size-8 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
          <UIcon name="i-heroicons-arrow-up-right" class="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Tool } from "~/types/tool.type";

defineProps<{ tool: Tool }>();
</script>

<style scoped>
.tool-card {
  box-shadow: 0 16px 40px -24px rgb(0 0 0 / 45%), inset 0 1px 0 rgb(255 255 255 / 4%);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.tool-card:hover {
  transform: translateY(-4px);
  border-color: var(--ui-primary);
  background-color: var(--ui-bg-elevated);
}

.tool-card:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .tool-card {
    transition: none;
  }

  .tool-card:hover {
    transform: none;
  }
}
</style>
