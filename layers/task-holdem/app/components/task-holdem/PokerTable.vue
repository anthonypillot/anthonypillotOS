<template>
  <section aria-label="Current round" class="round-panel relative flex min-h-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6">
    <div class="relative flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-slate-300">Round {{ room.round.number }}</h2>
      <span class="rounded-full border px-2.5 py-1 text-[11px] font-medium" :class="room.round.phase === 'revealed' ? 'border-emerald-300/15 bg-emerald-400/10 text-emerald-300' : 'border-indigo-300/15 bg-indigo-400/10 text-indigo-200'">{{ phaseLabel }}</span>
    </div>

    <div v-if="room.round.phase === 'voting'" class="relative flex flex-1 flex-col items-center justify-center py-6 text-center">
      <div class="mb-5 hidden h-14 items-center justify-center sm:flex" aria-hidden="true">
        <div class="preview-card -rotate-12 -translate-x-6 bg-slate-900">♣</div>
        <div class="preview-card z-10 border-indigo-300/40 bg-slate-800 text-3xl font-semibold text-white">?</div>
        <div class="preview-card translate-x-6 rotate-12 bg-slate-900">♠</div>
      </div>
      <h3 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">Every perspective counts.</h3>
      <p class="mt-2 max-w-sm text-sm leading-6 text-slate-400">Pick a card below. Reveal together when the team is ready.</p>
      <div class="mt-5 flex items-center gap-2" aria-live="polite">
        <span class="size-1.5 rounded-full" :class="everyoneReady ? 'bg-emerald-400' : 'bg-indigo-400'" />
        <p class="text-sm text-slate-300">{{ voteCount }} of {{ room.participants.length }} voted<span v-if="everyoneReady"> · Everyone is ready</span></p>
      </div>
      <UButton label="Reveal cards" icon="i-heroicons-eye" size="lg" class="mt-4 justify-center" :disabled="disabled || voteCount === 0" data-testid="reveal-button" @click="emit('reveal')" />
      <p class="mt-3 text-xs text-slate-500">Any player can reveal when you're ready.</p>
    </div>

    <div v-else-if="room.round.phase === 'revealing'" class="relative flex flex-1 flex-col items-center justify-center py-12 text-center" aria-live="polite">
      <p class="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">All cards on the table</p>
      <p class="my-5 text-8xl font-semibold tracking-tighter text-white tabular-nums">{{ countdown || '…' }}</p>
      <h3 class="text-xl font-medium text-slate-200">A little suspense. A shared perspective.</h3>
      <p class="mt-3 text-sm text-slate-500">Votes are locked for this round.</p>
    </div>

    <div v-else class="relative flex flex-1 flex-col items-center justify-center py-8 text-center" aria-live="polite">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Result</p>
      <h3 class="mt-4 text-2xl font-semibold tracking-tight text-white">Here's where the team landed.</h3>
      <p class="mt-4 text-lg text-slate-300">Average: <span class="font-semibold text-white">{{ average }}</span></p>
      <p class="mt-1 text-xs text-slate-500">Numeric votes only · {{ room.round.ballots?.length ?? 0 }} votes cast</p>
      <ul aria-label="Revealed votes" class="mt-7 flex max-w-full flex-wrap justify-center gap-3">
        <li v-for="ballot in room.round.ballots" :key="ballot.participantId" class="w-20">
          <span class="mx-auto flex h-16 w-12 items-center justify-center rounded-xl border border-indigo-300/25 bg-indigo-400/10 text-lg font-semibold text-indigo-100">{{ formatTaskHoldemVote(ballot.value) }}</span>
          <span class="mt-2 block truncate text-xs text-slate-400">{{ ballot.profile.name }}</span>
        </li>
      </ul>
      <UButton label="Next round" trailing-icon="i-heroicons-arrow-right" size="lg" class="mt-8" :disabled="disabled" data-testid="restart-button" @click="emit('restart')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TaskHoldemRoom } from "../../../shared/types/task-holdem.type";
import { formatTaskHoldemAverage, formatTaskHoldemVote } from "../../utils/task-holdem";

const props = defineProps<{ room: TaskHoldemRoom; disabled: boolean; countdown: number }>();
const emit = defineEmits<{ reveal: []; restart: [] }>();
const voteCount = computed(() => props.room.participants.filter(participant => participant.hasVoted).length);
const everyoneReady = computed(() => props.room.participants.length > 0 && voteCount.value === props.room.participants.length);
const phaseLabel = computed(() => ({ voting: "Voting open", revealing: "Revealing", revealed: "Cards revealed" })[props.room.round.phase]);
const average = computed(() => formatTaskHoldemAverage(props.room.round.average));
</script>

<style scoped>
.round-panel::before {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 35%, rgb(99 102 241 / 8%), transparent 65%);
  pointer-events: none;
  content: "";
}

.preview-card {
  position: absolute;
  display: flex;
  width: 3.25rem;
  height: 4.5rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(165 180 252 / 15%);
  border-radius: 0.65rem;
  color: rgb(165 180 252 / 60%);
}
</style>
