<template>
  <span class="playing-suit text-primary" :data-suit="suit" aria-hidden="true">{{ symbols[suit] }}</span>
</template>

<script setup lang="ts">
import type { TaskHoldemSuit } from "../../utils/task-holdem";

defineProps<{ suit: TaskHoldemSuit }>();
const symbols = { clubs: "♣\uFE0E", diamonds: "♦\uFE0E", spades: "♠\uFE0E", hearts: "♥\uFE0E" };
</script>
