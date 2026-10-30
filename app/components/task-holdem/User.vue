<template>
  <div class="flex min-w-0 items-center gap-3">
    <NuxtImg :src="useAvatar(participant.profile.avatar)" alt="" class="size-9 shrink-0 rounded-full bg-white/5 p-1" />
    <p class="max-w-32 truncate text-sm text-slate-300">{{ participant.profile.name }}</p>
    <UButton label="Leave room" aria-label="Leave room" icon="i-heroicons-arrow-right-start-on-rectangle" color="neutral" variant="ghost" size="sm" :disabled="disabled" @click="emit('leave')" />
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemParticipant } from "#shared/types/task-holdem.type";

defineProps<{ participant: TaskHoldemParticipant; disabled: boolean }>();
const emit = defineEmits<{ leave: [] }>();
</script>
