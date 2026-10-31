<template>
  <div class="flex min-w-0 items-center gap-3">
    <TaskHoldemMascot :avatar="participant.profile.avatar" class="size-10 rounded-lg bg-elevated/60 p-1" />
    <p class="max-w-32 truncate text-sm text-toned">{{ participant.profile.name }}</p>
    <UButton label="Leave room" aria-label="Leave room" icon="i-heroicons-arrow-right-start-on-rectangle" color="neutral" variant="ghost" size="sm" :disabled="disabled" @click="emit('leave')" />
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemParticipant } from "../../../shared/types/task-holdem.type";

defineProps<{ participant: TaskHoldemParticipant; disabled: boolean }>();
const emit = defineEmits<{ leave: [] }>();
</script>
