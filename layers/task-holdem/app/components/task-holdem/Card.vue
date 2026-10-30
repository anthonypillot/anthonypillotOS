<template>
  <button
    type="button"
    :aria-label="`Select ${value} card`"
    :aria-pressed="selected"
    :disabled="disabled"
    class="vote-card relative flex h-24 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-white outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed sm:w-full sm:max-w-16"
    :class="selected ? 'selected border-indigo-300 bg-indigo-400/20 shadow-lg shadow-indigo-500/10' : 'border-white/10 bg-slate-900 hover:border-indigo-300/50 hover:bg-indigo-400/10 disabled:opacity-40'"
    @click="emit('select', value)"
  >
    <span v-if="typeof value === 'number'" class="text-2xl font-semibold tracking-tight">{{ value }}</span>
    <template v-else>
      <UIcon :name="taskHoldemCardIcons[value]" class="size-6" aria-hidden="true" />
      <span class="text-[10px] text-slate-400">{{ formatTaskHoldemVote(value) }}</span>
    </template>
    <span class="absolute left-2 top-1.5 text-[9px] text-indigo-300/60" aria-hidden="true">♠</span>
    <UIcon v-if="selected" name="i-heroicons-check-circle-solid" class="absolute -right-1.5 -top-1.5 size-5 rounded-full bg-slate-950 text-indigo-300" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import type { TaskHoldemVote } from "../../../shared/types/task-holdem.type";
import { formatTaskHoldemVote, taskHoldemCardIcons } from "../../utils/task-holdem";

defineProps<{ value: TaskHoldemVote; selected: boolean; disabled: boolean }>();
const emit = defineEmits<{ select: [value: TaskHoldemVote] }>();
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .vote-card:not(:disabled):hover,
  .vote-card.selected {
    transform: translateY(-4px);
  }
}
</style>
