<template>
  <UButton
    aria-label="Sound effects"
    :aria-pressed="!preferences.muted"
    :title="audioStatus === 'unavailable' ? 'Audio is unavailable here.' : preferences.muted ? 'Enable sound effects' : 'Mute sound effects'"
    :icon="preferences.muted ? 'i-heroicons-speaker-x-mark' : 'i-heroicons-speaker-wave'"
    :disabled="audioStatus === 'unavailable'"
    color="neutral"
    variant="ghost"
    @click="toggleSound"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ feedback: ReturnType<typeof useTaskHoldemFeedback> }>();
const { preferences, audioStatus, toggleSound } = props.feedback;
</script>
