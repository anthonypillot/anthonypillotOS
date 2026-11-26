<template>
  <div aria-hidden="true" class="tool-preview relative flex h-44 items-center justify-center overflow-hidden rounded-2xl px-4 sm:h-52" :class="`preview-${toolId}`">
    <div v-if="toolId === 'task-holdem'" class="relative w-full max-w-64">
      <div class="mb-5 flex items-center justify-between px-3 text-[0.625rem] font-medium uppercase tracking-widest text-indigo-200/70">
        <span>Sprint planning</span>
        <span class="flex items-center gap-1.5"><span class="size-1.5 rounded-full bg-emerald-300" />Live</span>
      </div>
      <div class="flex items-center justify-center gap-2.5">
        <div class="estimate-card -rotate-12 text-indigo-200/70">3</div>
        <div class="estimate-card -translate-y-2 border-indigo-300/60! bg-indigo-400/25! text-white shadow-lg shadow-indigo-950/40">
          <UIcon name="i-heroicons-sparkles" class="absolute right-2 top-2 size-3 text-indigo-200" />
          5
        </div>
        <div class="estimate-card rotate-12 text-indigo-200/70">8</div>
      </div>
      <div class="mt-4 flex items-center justify-center gap-2 text-[0.625rem] text-indigo-100/70">
        <div class="flex -space-x-1.5">
          <span v-for="initial in ['A', 'J', 'M']" :key="initial" class="flex size-5 items-center justify-center rounded-full border border-default bg-indigo-300 text-[0.5rem] font-semibold text-indigo-950">{{ initial }}</span>
        </div>
        <span>Better estimates, together</span>
      </div>
    </div>

    <div v-else class="w-full max-w-64 rounded-xl border border-violet-200/15 bg-default/40 p-4 shadow-xl shadow-slate-950/20">
      <div class="flex items-center justify-between text-[0.625rem] text-violet-200/80">
        <span class="flex items-center gap-1.5"><UIcon name="i-heroicons-bolt" class="size-3.5" />Fact or fiction?</span>
        <span>01 / 10</span>
      </div>
      <p class="my-4 text-center text-xs font-medium leading-5 text-highlighted">The first computer bug<br>was an actual moth.</p>
      <div class="grid grid-cols-2 gap-2 text-[0.625rem] font-medium">
        <span class="flex items-center justify-center gap-1.5 rounded-lg border border-violet-300/35 bg-violet-400/20 py-2 text-violet-100"><UIcon name="i-heroicons-check" class="size-3.5" />True</span>
        <span class="flex items-center justify-center gap-1.5 rounded-lg border border-default bg-elevated/60 py-2 text-toned"><UIcon name="i-heroicons-x-mark" class="size-3.5" />False</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolId } from "~/types/tool.type";

defineProps<{ toolId: ToolId }>();
</script>

<style scoped>
.tool-preview {
  background-color: var(--ui-bg);
  background-image: radial-gradient(ellipse at 50% 90%, var(--preview-glow), transparent 80%);
  border: 1px solid var(--ui-border);
}

.preview-task-holdem {
  --preview-glow: rgb(99 102 241 / 25%);
}

.preview-it-facts {
  --preview-glow: rgb(139 92 246 / 22%);
}

.estimate-card {
  position: relative;
  display: flex;
  width: 3.25rem;
  height: 4.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(165 180 252 / 20%);
  border-radius: 0.625rem;
  background: rgb(129 140 248 / 8%);
  font-size: 1.625rem;
  font-weight: 600;
}
</style>
