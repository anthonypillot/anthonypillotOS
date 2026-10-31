<template>
  <span class="playing-suit" :class="{ 'playing-suit-red': suit === 'diamonds' || suit === 'hearts' }" :data-suit="suit" aria-hidden="true">{{ symbols[suit] }}</span>
</template>

<script setup lang="ts">
import type { TaskHoldemSuit } from "../../utils/task-holdem";

defineProps<{ suit: TaskHoldemSuit }>();
const symbols = { clubs: "♣\uFE0E", diamonds: "♦\uFE0E", spades: "♠\uFE0E", hearts: "♥\uFE0E" };
</script>

<style scoped>
.playing-suit {
  display: inline-flex;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #000;
  font-family: Georgia, serif;
  font-weight: 400;
  line-height: 1;
  /* Keep black ink visible on dark card faces without a backing tile. */
  -webkit-text-stroke: 0.75px color-mix(in srgb, var(--ui-text-highlighted) 70%, transparent);
  paint-order: stroke fill;
}
.playing-suit-red { color: #dc2626; -webkit-text-stroke-width: 0; }
</style>
