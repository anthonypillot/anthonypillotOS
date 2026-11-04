<template>
  <div class="flex min-w-0 items-center gap-3">
    <TaskHoldemMascot :avatar="participant.profile.avatar" :ambient="false" :active="active" :reaction="reaction" class="size-10 rounded-lg bg-elevated/60 p-1" />
    <p class="max-w-32 truncate text-sm text-toned">{{ participant.profile.name }}</p>
    <UButton label="Leave room" aria-label="Leave room" icon="i-heroicons-arrow-right-start-on-rectangle" color="neutral" variant="ghost" size="sm" :disabled="disabled" @click="emit('leave')" />
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemParticipant } from "../../../shared/types/room.type";

const props = withDefaults(defineProps<{ participant: TaskHoldemParticipant; disabled: boolean; active?: boolean }>(), { active: true });
const { reaction } = useTaskHoldemMascotReaction(() => props.participant.id);
const emit = defineEmits<{ leave: [] }>();
</script>
