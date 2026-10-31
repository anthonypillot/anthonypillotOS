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
  width: 1.25em;
  height: 1.25em;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.15em;
  color: #000;
  background: #fff;
  font-family: Georgia, serif;
  font-weight: 400;
  line-height: 1;
}
.playing-suit-red { color: #dc2626; }
</style>
