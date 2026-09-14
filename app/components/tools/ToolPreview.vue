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
          <span v-for="initial in ['A', 'J', 'M']" :key="initial" class="flex size-5 items-center justify-center rounded-full border border-slate-800 bg-indigo-300 text-[0.5rem] font-semibold text-indigo-950">{{ initial }}</span>
        </div>
        <span>Better estimates, together</span>
      </div>
    </div>

    <div v-else-if="toolId === 'history-cleaner'" class="w-full max-w-64 rounded-xl border border-sky-200/15 bg-slate-950/40 p-3 shadow-xl shadow-slate-950/20">
      <div class="mb-2 flex items-center gap-2 border-b border-white/10 pb-2 text-[0.625rem] text-sky-100/80 sm:mb-3 sm:pb-2.5">
        <UIcon name="i-heroicons-folder" class="size-3.5 text-sky-300" />
        <span>your-repository / history</span>
        <UIcon name="i-heroicons-ellipsis-horizontal" class="ml-auto size-4" />
      </div>
      <div class="space-y-1.5 sm:space-y-2">
        <div v-for="run in ['Workflow run #128', 'Workflow run #127', 'Deployment #42']" :key="run" class="flex items-center gap-2 rounded-md bg-white/4 px-2 py-1 text-[0.625rem] text-slate-300 sm:py-1.5">
          <UIcon name="i-heroicons-check-circle" class="size-3.5 shrink-0 text-sky-300" />
          <span>{{ run }}</span>
          <UIcon name="i-heroicons-trash" class="ml-auto size-3 shrink-0 text-slate-500" />
        </div>
      </div>
      <div class="mt-2 flex items-center justify-between text-[0.5625rem] sm:mt-3">
        <span class="text-slate-400">3 items selected</span>
        <span class="flex items-center gap-1 text-sky-200"><UIcon name="i-heroicons-sparkles" class="size-3" />Ready to clean</span>
      </div>
    </div>

    <div v-else class="w-full max-w-64 rounded-xl border border-violet-200/15 bg-slate-950/40 p-4 shadow-xl shadow-slate-950/20">
      <div class="flex items-center justify-between text-[0.625rem] text-violet-200/80">
        <span class="flex items-center gap-1.5"><UIcon name="i-heroicons-bolt" class="size-3.5" />Fact or fiction?</span>
        <span>01 / 10</span>
      </div>
      <p class="my-4 text-center text-xs font-medium leading-5 text-slate-100">The first computer bug<br>was an actual moth.</p>
      <div class="grid grid-cols-2 gap-2 text-[0.625rem] font-medium">
        <span class="flex items-center justify-center gap-1.5 rounded-lg border border-violet-300/35 bg-violet-400/20 py-2 text-violet-100"><UIcon name="i-heroicons-check" class="size-3.5" />True</span>
        <span class="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-slate-300"><UIcon name="i-heroicons-x-mark" class="size-3.5" />False</span>
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
  background-color: #111827;
  background-image: radial-gradient(ellipse at 50% 90%, var(--preview-glow), transparent 80%);
  border: 1px solid rgb(255 255 255 / 5%);
}

.preview-task-holdem {
  --preview-glow: rgb(99 102 241 / 25%);
}

.preview-history-cleaner {
  --preview-glow: rgb(14 165 233 / 18%);
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
