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
    <TaskHoldemSuit :suit="getTaskHoldemCardSuit(value)" class="absolute left-2 top-1.5 text-base" />
    <span v-if="selected" class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-default" aria-hidden="true">
      <UIcon name="i-heroicons-check-circle-solid" class="size-5 text-highlighted" data-testid="selected-card-marker" />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { TaskHoldemVote } from "../../../shared/types/task-holdem.type";
import { formatTaskHoldemVote, getTaskHoldemCardSuit, taskHoldemCardIcons } from "../../utils/task-holdem";

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
