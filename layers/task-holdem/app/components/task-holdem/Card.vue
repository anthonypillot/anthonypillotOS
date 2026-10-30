<template>
  <button
    type="button"
    :aria-label="`Select ${value} card`"
    :aria-pressed="selected"
    :disabled="disabled"
    class="vote-card relative flex h-24 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-highlighted outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-default disabled:cursor-not-allowed sm:w-full sm:max-w-16"
    :class="selected ? 'selected border-primary bg-primary/20 shadow-lg shadow-primary/10' : 'border-accented bg-default hover:border-primary hover:bg-primary/10 disabled:opacity-40'"
    @click="emit('select', value)"
  >
    <span v-if="typeof value === 'number'" class="text-2xl font-semibold tracking-tight">{{ value }}</span>
    <template v-else>
      <UIcon :name="taskHoldemCardIcons[value]" class="size-6" aria-hidden="true" />
      <span class="text-[10px] text-muted">{{ formatTaskHoldemVote(value) }}</span>
    </template>
    <span class="absolute left-2 top-1.5 text-[9px] text-primary/60" aria-hidden="true">♠</span>
    <UIcon v-if="selected" name="i-heroicons-check-circle-solid" class="absolute -right-1.5 -top-1.5 size-5 rounded-full bg-default text-primary" aria-hidden="true" />
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
