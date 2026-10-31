<template>
  <section aria-label="Current round" class="round-panel relative flex min-h-80 flex-col overflow-hidden rounded-2xl border border-default bg-muted/50 p-5 sm:p-6">
    <div class="relative flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-toned">Round {{ room.round.number }}</h2>
      <span class="rounded-full border px-2.5 py-1 text-[11px] font-medium" :class="room.round.phase === 'revealed' ? 'border-success/20 bg-success/10 text-success' : 'border-primary/20 bg-primary/10 text-primary'">{{ phaseLabel }}</span>
    </div>

    <div v-if="room.round.phase === 'voting'" class="relative flex flex-1 flex-col items-center justify-center py-6 text-center">
      <div class="mb-5 hidden h-14 items-center justify-center sm:flex" aria-hidden="true">
        <div class="preview-card -rotate-12 -translate-x-6 bg-default"><TaskHoldemSuit suit="clubs" class="text-2xl" /></div>
        <div class="preview-card z-10 border-primary/40 bg-muted text-3xl font-semibold text-highlighted">?</div>
        <div class="preview-card translate-x-6 rotate-12 bg-default"><TaskHoldemSuit suit="spades" class="text-2xl" /></div>
      </div>
      <h3 class="text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">Every perspective counts.</h3>
      <p class="mt-2 max-w-sm text-sm leading-6 text-muted">Pick a card below. Reveal together when the team is ready.</p>
      <div class="mt-5 flex items-center gap-2" aria-live="polite">
        <span class="size-1.5 rounded-full" :class="everyoneReady ? 'bg-success' : 'bg-primary'" />
        <p class="text-sm text-toned">{{ voteCount }} of {{ room.participants.length }} voted<span v-if="everyoneReady"> · Everyone is ready</span></p>
      </div>
      <UButton label="Reveal cards" icon="i-heroicons-eye" size="lg" class="mt-4 justify-center" :disabled="disabled || voteCount === 0" data-testid="reveal-button" @click="emit('reveal')" />
      <p class="mt-3 text-xs text-muted">Any player can reveal when you're ready.</p>
    </div>

    <div v-else-if="room.round.phase === 'revealing'" class="relative flex flex-1 flex-col items-center justify-center py-12 text-center" aria-live="polite">
      <p class="text-sm font-medium uppercase tracking-[0.2em] text-primary">All cards on the table</p>
      <p class="my-5 text-8xl font-semibold tracking-tighter text-highlighted tabular-nums">{{ countdown || '…' }}</p>
      <h3 class="text-xl font-medium text-default">A little suspense. A shared perspective.</h3>
      <p class="mt-3 text-sm text-muted">Votes are locked for this round.</p>
    </div>

    <div v-else class="relative flex flex-1 flex-col items-center justify-center py-8 text-center" aria-live="polite">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-success">Result</p>
      <h3 class="mt-4 text-2xl font-semibold tracking-tight text-highlighted">Here's where the team landed.</h3>
      <p class="mt-4 text-lg text-toned">Average: <span class="font-semibold text-highlighted">{{ average }}</span></p>
      <p class="mt-1 text-xs text-muted">Numeric votes only · {{ room.round.ballots?.length ?? 0 }} votes cast</p>
      <ul aria-label="Revealed votes" class="mt-7 flex max-w-full flex-wrap justify-center gap-3">
        <li v-for="ballot in room.round.ballots" :key="ballot.participantId" class="w-20">
          <span class="mx-auto flex h-16 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-lg font-semibold text-primary">{{ formatTaskHoldemVote(ballot.value) }}</span>
          <span class="mt-2 block truncate text-xs text-muted">{{ ballot.profile.name }}</span>
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
  background: radial-gradient(ellipse at 50% 35%, color-mix(in srgb, var(--ui-primary) 5%, transparent), transparent 65%);
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
  border: 1px solid var(--ui-border);
  border-radius: 0.65rem;
}
</style>
