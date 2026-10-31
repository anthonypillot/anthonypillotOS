<template>
  <section class="task-workspace relative isolate mx-auto w-full max-w-7xl px-4 pb-12 pt-32 sm:px-6 sm:pt-36 lg:px-8">
    <header class="mb-8 flex flex-col justify-between gap-5 border-b border-default pb-6 sm:flex-row sm:items-center">
      <div class="flex min-w-0 items-center gap-3">
        <NuxtImg class="size-11 shrink-0" :src="taskHoldemApplication.faviconDark" alt="" />
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-semibold tracking-tight text-highlighted">{{ taskHoldemApplication.name }}</h1>
            <span class="rounded border border-primary/15 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">Planning poker</span>
          </div>
          <p class="mt-1 text-xs text-muted">Less guesswork. More alignment.</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span role="status" data-testid="connection-status" class="flex items-center gap-2 text-xs text-muted" aria-live="polite">
          <span class="size-1.5 rounded-full" :class="isConnected && (!isJoined || isAdmitted) ? 'bg-success' : 'bg-warning'" />{{ connectionLabel }}
        </span>
        <TaskHoldemFeedback :feedback="feedback" />
        <TaskHoldemUser v-if="currentParticipant" :participant="currentParticipant" :disabled="!canAct" @leave="leave" />
      </div>
    </header>

    <div v-if="error" role="alert" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
      <p class="min-w-0 flex-1">{{ error }}</p>
      <UButton v-if="!invalidLink" label="Try again" variant="ghost" color="warning" size="xs" @click="retry" />
      <NuxtLink v-if="(!isJoined && roomId) || invalidLink" :to="taskHoldemApplication.path" class="text-xs font-medium underline underline-offset-4">Create a new room</NuxtLink>
    </div>

    <p v-if="feedback.notificationError.value" role="status" class="mb-6 text-sm text-warning">{{ feedback.notificationError.value }}</p>

    <div v-if="!isJoined" class="grid overflow-hidden rounded-3xl border border-default bg-muted/40 lg:grid-cols-2">
      <div class="join-intro relative hidden flex-col justify-between overflow-hidden border-r border-default p-10 lg:flex">
        <div>
          <p class="max-w-sm text-4xl font-semibold leading-tight tracking-tight text-highlighted">Great estimates start with<br><span class="text-primary">a conversation.</span></p>
          <p class="mt-5 max-w-sm text-sm leading-7 text-muted">Give every perspective a seat. Vote independently, reveal together, and spend more time on what matters.</p>
        </div>
        <div class="my-10 flex items-center justify-center gap-4" aria-hidden="true">
          <div class="intro-card -rotate-12">3<TaskHoldemSuit suit="clubs" class="text-sm" /></div>
          <div class="intro-card -translate-y-5 border-primary/40 bg-primary/10">5<TaskHoldemSuit suit="spades" class="text-sm" /></div>
          <div class="intro-card rotate-12">8<TaskHoldemSuit suit="diamonds" class="text-sm" /></div>
        </div>
        <div class="flex flex-wrap gap-4 text-xs text-muted"><span class="flex items-center gap-2"><UIcon name="i-heroicons-lock-closed" class="size-4" />Private votes</span><span class="flex items-center gap-2"><UIcon name="i-heroicons-bolt" class="size-4" />Real-time teamwork</span><span class="flex items-center gap-2"><UIcon name="i-heroicons-user-circle" class="size-4" />No account needed</span></div>
      </div>
      <div class="flex min-h-[32rem] flex-col justify-center p-6 sm:p-10 lg:p-12">
        <div v-if="isLoading" class="mb-5 flex items-center gap-2 text-xs text-muted" role="status"><UIcon name="i-heroicons-arrow-path" class="size-4 motion-safe:animate-spin" /> Preparing your room…</div>
        <TaskHoldemCreateUser
          :profile="profile"
          :creating="!roomId"
          :disabled="!canJoin"
          :busy="isBusy"
          @submit="join"
        />
      </div>
    </div>

    <div v-else-if="room && self" class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-primary">Your team space</p>
          <p class="mt-1.5 hidden text-sm text-muted sm:block">Same room. Fresh perspectives.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <TaskHoldemHistory :key="room.id" :count="room.historyCount" :load="loadHistory" />
          <TaskHoldemActions :disabled="!canAct" @copied="feedback.play('success')" />
        </div>
      </div>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div class="min-w-0 space-y-5">
          <TaskHoldemTopic :round="room.round" :disabled="!canAct" :save-topic="setTopic" />
          <TaskHoldemPokerTable
            :room="room"
            :disabled="!canAct"
            :countdown="countdown"
            @reveal="reveal"
            @restart="restart"
          />
          <section aria-label="Your cards" class="rounded-2xl border border-default bg-muted/50 p-5 sm:p-6">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-sm font-medium text-default">Your estimate</h2>
              <p class="text-xs" :class="selectedVote !== null ? 'text-success' : 'text-muted'" role="status">{{ selectionLabel }}</p>
            </div>
            <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 pt-2 sm:grid sm:grid-cols-6 sm:justify-items-center sm:overflow-visible xl:grid-cols-12">
              <TaskHoldemCard
                v-for="card in room.round.deck"
                :key="card"
                :value="card"
                :selected="selectedVote === card"
                :disabled="!canAct || room.round.phase !== 'voting'"
                @select="vote"
              />
            </div>
            <p class="mt-3 text-xs leading-5 text-muted">{{ room.round.phase === 'voting' ? 'Change your mind anytime before the reveal. Select your card again to clear it.' : 'Voting is closed. A new round brings a fresh start.' }}</p>
          </section>
        </div>

        <aside class="min-w-0 space-y-5" aria-label="Room sidebar">
          <section aria-labelledby="participants-heading" class="rounded-2xl border border-default bg-muted/50 p-3">
            <div class="flex items-center justify-between px-2 pb-4 pt-2">
              <h2 id="participants-heading" class="text-sm font-medium text-default">At the table</h2>
              <span class="rounded-md bg-elevated px-2 py-0.5 text-xs tabular-nums text-muted">{{ room.participants.length }}</span>
            </div>
            <div class="max-h-96 space-y-1 overflow-y-auto">
              <TaskHoldemPokerPlayer
                v-for="participant in room.participants"
                :key="participant.id"
                :participant="participant"
                :current="participant.id === self.participantId"
                :celebrating="room.round.phase === 'revealed'"
                :vote="room.round.ballots?.find(ballot => ballot.participantId === participant.id)?.value ?? null"
              />
            </div>
            <p class="mt-3 border-t border-default px-2 pt-4 text-[11px] leading-5 text-muted">A brief disconnect keeps your seat warm. Use “Leave room” when you're done.</p>
          </section>
          <TaskHoldemChat
            v-model="chatDraft"
            :messages="messages"
            :disabled="!canAct"
            :sending="isSending"
            @submit="submitChat"
          />
        </aside>
      </div>
    </div>
    <p class="mt-8 text-center text-[11px] text-muted">Built for the conversation, not just the number.</p>
  </section>
</template>

<script setup lang="ts">
useApplicationSeo(taskHoldemApplication);

const {
  roomId, room, self, profile, messages, error, invalidLink, connection, countdown, feedback,
  isConnected, isAdmitted, isLoading, isBusy, isSending, isJoined, canAct, canJoin, selectedVote, currentParticipant,
  join, vote, reveal, restart, setTopic, loadHistory, leave, sendMessage, retry,
} = useTaskHoldemRoom();
const chatDraft = ref("");
const connectionLabel = computed(() => {
  if (isConnected.value && (isLoading.value || (isBusy.value && !isAdmitted.value))) return "Syncing room…";
  if (isConnected.value && isJoined.value && !isAdmitted.value) return "Rejoin required";
  return ({ connecting: "Connecting…", connected: "Live", reconnecting: "Reconnecting…", offline: "Offline" })[connection.value];
});
const selectionLabel = computed(() => selectedVote.value !== null ? "Your vote is in" : room.value?.round.phase === "voting" ? "Pick what feels right" : "Ready for the next round");

async function submitChat(content: string): Promise<void> {
  if (await sendMessage(content) && chatDraft.value.trim() === content) chatDraft.value = "";
}
</script>

<style scoped>
.task-workspace::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 30% 5%, rgb(99 102 241 / 6%), transparent 50%);
  pointer-events: none;
  content: "";
}

.join-intro {
  background: radial-gradient(ellipse at 50% 60%, rgb(99 102 241 / 10%), transparent 70%);
}

.intro-card {
  display: flex;
  width: 5rem;
  height: 7rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 1rem;
  color: var(--ui-text-highlighted);
  background: var(--ui-bg);
  font-size: 2rem;
  font-weight: 600;
}

</style>
