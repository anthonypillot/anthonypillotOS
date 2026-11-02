<template>
  <div
    role="group"
    :aria-label="participant.profile.name"
    :data-participant-id="participant.id"
    :data-voted="participant.hasVoted"
    :data-connected="participant.connected"
    class="flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3"
    :class="current ? 'border-default bg-primary/7' : 'border-transparent'"
  >
    <div class="relative shrink-0">
      <TaskHoldemMascot class="size-12 rounded-xl bg-elevated/60 p-1" :avatar="participant.profile.avatar" :label="taskHoldemMascots[participant.profile.avatar].name" :active="participant.connected" :voted="participant.hasVoted" :celebrating="celebrating" />
      <span class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-default" :class="participant.connected ? 'bg-success' : 'bg-warning'" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-default">{{ participant.profile.name }} <span v-if="current" class="ml-1 text-xs font-normal text-muted">you</span></p>
      <BaseLatticeLoader v-if="participant.connected && (participant.hasVoted || phase === 'voting')" :status="participant.hasVoted ? 'done' : 'working'" :label="participant.hasVoted ? 'Vote is in' : 'Thinking…'" :announcement="`${participant.profile.name}: ${participant.hasVoted ? 'Vote is in' : 'Thinking…'}`" class="mt-0.5" />
      <p v-else class="mt-0.5 text-xs" :class="participant.connected ? 'text-muted' : 'text-warning'">{{ participant.connected ? 'No vote' : 'Reconnecting…' }}</p>
    </div>
    <span v-if="vote !== null" class="flex min-h-9 min-w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-2 text-sm font-semibold text-primary">{{ formatTaskHoldemVote(vote) }}</span>
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemParticipant, TaskHoldemPhase, TaskHoldemVote } from "../../../shared/types/room.type";
import { formatTaskHoldemVote } from "../../utils/cards";
import { taskHoldemMascots } from "../../../shared/data/mascots";

defineProps<{ participant: TaskHoldemParticipant; phase: TaskHoldemPhase; current: boolean; vote: TaskHoldemVote | null; celebrating: boolean }>();
</script>
