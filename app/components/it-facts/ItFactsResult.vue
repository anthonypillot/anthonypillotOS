<template>
  <div class="flex flex-col gap-y-6" data-testid="it-facts-result">
    <div class="flex flex-col gap-y-2">
      <h3 class="text-2xl font-bold text-white" data-testid="it-facts-result-heading">Round complete</h3>
      <p class="text-lg text-gray-200" data-testid="it-facts-result-score">
        You scored <span class="font-semibold text-white">{{ score }}</span> out of {{ roundLength }}.
      </p>
      <p class="text-sm text-gray-300" data-testid="it-facts-result-best">Best score: {{ best }}</p>
    </div>
    <div>
      <UButton label="Play again" color="primary" data-testid="it-facts-play-again" @click="restart" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  score: number;
  roundLength: number;
  best: number;
}>();

const emit = defineEmits<{ restart: [] }>();

function restart(): void {
  emit("restart");
}
</script>
