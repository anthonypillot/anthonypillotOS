<template>
  <div
    role="group"
    :aria-label="participant.profile.name"
    :data-participant-id="participant.id"
    :data-voted="participant.hasVoted"
    :data-connected="participant.connected"
    class="flex min-w-0 items-center gap-3 rounded-xl px-3 py-3"
    :class="current ? 'bg-primary/7 ring-1 ring-primary/20' : ''"
  >
    <div class="relative shrink-0">
      <TaskHoldemMascot class="size-12 rounded-xl bg-elevated/60 p-1" :avatar="participant.profile.avatar" :label="taskHoldemMascots[participant.profile.avatar].name" :voted="participant.hasVoted" :celebrating="celebrating" />
      <span class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-default" :class="participant.connected ? 'bg-success' : 'bg-warning'" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-default">{{ participant.profile.name }} <span v-if="current" class="ml-1 text-xs font-normal text-muted">you</span></p>
      <p class="mt-0.5 text-xs" :class="participant.connected ? 'text-muted' : 'text-warning'">{{ participant.connected ? (participant.hasVoted ? 'Vote is in' : 'Thinking…') : 'Reconnecting…' }}</p>
    </div>
    <span v-if="vote !== null" class="flex min-h-9 min-w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-2 text-sm font-semibold text-primary">{{ formatTaskHoldemVote(vote) }}</span>
    <UIcon
      v-else
      :name="participant.hasVoted ? 'i-heroicons-check-circle-solid' : 'i-heroicons-ellipsis-horizontal'"
      class="size-5 shrink-0"
      :class="participant.hasVoted ? 'text-success' : 'text-muted'"
      :aria-label="participant.hasVoted ? 'Voted' : 'Waiting for vote'"
    />
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemParticipant, TaskHoldemVote } from "../../../shared/types/task-holdem.type";
import { formatTaskHoldemVote } from "../../utils/task-holdem";
import { taskHoldemMascots } from "../../../shared/data/task-holdem-mascots";

defineProps<{ participant: TaskHoldemParticipant; current: boolean; vote: TaskHoldemVote | null; celebrating: boolean }>();
</script>
