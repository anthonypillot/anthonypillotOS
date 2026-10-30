<template>
  <div
    role="group"
    :aria-label="participant.profile.name"
    :data-participant-id="participant.id"
    :data-voted="participant.hasVoted"
    :data-connected="participant.connected"
    class="flex min-w-0 items-center gap-3 rounded-xl px-3 py-3"
    :class="current ? 'bg-indigo-400/[0.07] ring-1 ring-indigo-300/10' : ''"
  >
    <div class="relative shrink-0">
      <NuxtImg class="size-10 rounded-full bg-white/5 p-1.5" :src="useAvatar(participant.profile.avatar)" :alt="`poker player ${participant.profile.avatar}`" />
      <span class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-slate-900" :class="participant.connected ? 'bg-emerald-400' : 'bg-amber-400'" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-slate-200">{{ participant.profile.name }} <span v-if="current" class="ml-1 text-xs font-normal text-slate-500">you</span></p>
      <p class="mt-0.5 text-xs" :class="participant.connected ? 'text-slate-500' : 'text-amber-300'">{{ participant.connected ? (participant.hasVoted ? 'Vote is in' : 'Thinking…') : 'Reconnecting…' }}</p>
    </div>
    <span v-if="vote !== null" class="flex min-h-9 min-w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-300/20 bg-indigo-400/10 px-2 text-sm font-semibold text-indigo-200">{{ formatTaskHoldemVote(vote) }}</span>
    <UIcon
      v-else
      :name="participant.hasVoted ? 'i-heroicons-check-circle-solid' : 'i-heroicons-ellipsis-horizontal'"
      class="size-5 shrink-0"
      :class="participant.hasVoted ? 'text-emerald-400' : 'text-slate-600'"
      :aria-label="participant.hasVoted ? 'Voted' : 'Waiting for vote'"
    />
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemParticipant, TaskHoldemVote } from "#shared/types/task-holdem.type";
import { formatTaskHoldemVote } from "~/utils/task-holdem";

defineProps<{ participant: TaskHoldemParticipant; current: boolean; vote: TaskHoldemVote | null }>();
</script>
