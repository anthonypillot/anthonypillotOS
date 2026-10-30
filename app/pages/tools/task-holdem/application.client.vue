<template>
  <section class="task-workspace relative isolate mx-auto w-full max-w-7xl px-4 pb-12 pt-32 sm:px-6 sm:pt-36 lg:px-8">
    <header class="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
      <div class="flex min-w-0 items-center gap-3">
        <NuxtImg class="size-11 shrink-0" :src="taskHoldemApplication.faviconDark" alt="" />
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-semibold tracking-tight text-white">{{ taskHoldemApplication.name }}</h1>
            <span class="rounded border border-indigo-300/15 bg-indigo-400/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-indigo-300">Planning poker</span>
          </div>
          <p class="mt-1 text-xs text-slate-500">Less guesswork. More alignment.</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span role="status" data-testid="connection-status" class="flex items-center gap-2 text-xs text-slate-400" aria-live="polite">
          <span class="size-1.5 rounded-full" :class="isConnected ? 'bg-emerald-400' : 'bg-amber-400'" />{{ connectionLabel }}
        </span>
        <TaskHoldemUser v-if="currentParticipant" :participant="currentParticipant" :disabled="!canAct" @leave="leave" />
      </div>
    </header>

    <div v-if="error" role="alert" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-400/5 p-4 text-sm text-amber-100">
      <p class="min-w-0 flex-1">{{ error }}</p>
      <UButton v-if="!invalidLink" label="Try again" variant="ghost" color="warning" size="xs" @click="retry" />
      <NuxtLink v-if="(!isJoined && roomId) || invalidLink" :to="taskHoldemApplication.path" class="text-xs font-medium underline underline-offset-4">Create a new room</NuxtLink>
    </div>

    <div v-if="!isJoined" class="grid overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 lg:grid-cols-2">
      <div class="join-intro relative hidden flex-col justify-between overflow-hidden border-r border-white/5 p-10 lg:flex">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300"><span class="size-1.5 rounded-full bg-emerald-400" /> Made for your next planning session</span>
          <p class="mt-8 max-w-sm text-4xl font-semibold leading-tight tracking-tight text-white">Great estimates start with<br><span class="text-indigo-300">a conversation.</span></p>
          <p class="mt-5 max-w-sm text-sm leading-7 text-slate-400">Give every perspective a seat. Vote independently, reveal together, and spend more time on what matters.</p>
        </div>
        <div class="my-10 flex items-center justify-center gap-4" aria-hidden="true">
          <div class="intro-card -rotate-12">3<span>♣</span></div>
          <div class="intro-card -translate-y-5 border-indigo-300/40 bg-indigo-400/10">5<span>♠</span></div>
          <div class="intro-card rotate-12">8<span>♦</span></div>
        </div>
        <div class="flex gap-6 text-xs text-slate-500"><span class="flex items-center gap-2"><UIcon name="i-heroicons-lock-closed" class="size-4" />Private votes</span><span class="flex items-center gap-2"><UIcon name="i-heroicons-bolt" class="size-4" />Real-time teamwork</span></div>
      </div>
      <div class="flex min-h-[32rem] flex-col justify-center p-6 sm:p-10 lg:p-12">
        <div v-if="isLoading" class="mb-5 flex items-center gap-2 text-xs text-slate-400" role="status"><UIcon name="i-heroicons-arrow-path" class="size-4 motion-safe:animate-spin" /> Preparing your room…</div>
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
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-indigo-300">Your team space</p>
          <p class="mt-1.5 hidden text-sm text-slate-400 sm:block">Same room. Fresh perspectives.</p>
        </div>
        <TaskHoldemActions :disabled="!canAct" />
      </div>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div class="min-w-0 space-y-5">
          <TaskHoldemPokerTable
            :room="room"
            :disabled="!canAct"
            :countdown="countdown"
            @reveal="reveal"
            @restart="restart"
          />
          <section aria-label="Your cards" class="rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-sm font-medium text-slate-200">Your estimate</h2>
              <p class="text-xs" :class="selectedVote !== null ? 'text-emerald-300' : 'text-slate-500'" role="status">{{ selectionLabel }}</p>
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
            <p class="mt-3 text-xs leading-5 text-slate-500">{{ room.round.phase === 'voting' ? 'Change your mind anytime before the reveal. Select your card again to clear it.' : 'Voting is closed. A new round brings a fresh start.' }}</p>
          </section>
        </div>

        <aside class="min-w-0 space-y-5" aria-label="Room sidebar">
          <section aria-labelledby="participants-heading" class="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <div class="flex items-center justify-between px-2 pb-4 pt-2">
              <h2 id="participants-heading" class="text-sm font-medium text-slate-200">At the table</h2>
              <span class="rounded-md bg-white/5 px-2 py-0.5 text-xs tabular-nums text-slate-400">{{ room.participants.length }}</span>
            </div>
            <div class="max-h-96 space-y-1 overflow-y-auto">
              <TaskHoldemPokerPlayer
                v-for="participant in room.participants"
                :key="participant.id"
                :participant="participant"
                :current="participant.id === self.participantId"
                :vote="room.round.ballots?.find(ballot => ballot.participantId === participant.id)?.value ?? null"
              />
            </div>
            <p class="mt-3 border-t border-white/5 px-2 pt-4 text-[11px] leading-5 text-slate-500">A brief disconnect keeps your seat warm. Use “Leave room” when you're done.</p>
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
    <p class="mt-8 text-center text-[11px] text-slate-600">Built for the conversation, not just the number.</p>
  </section>
</template>

<script setup lang="ts">
useApplicationSeo(taskHoldemApplication);

const {
  roomId, room, self, profile, messages, error, invalidLink, connection, countdown,
  isConnected, isLoading, isBusy, isSending, isJoined, canAct, canJoin, selectedVote, currentParticipant,
  join, vote, reveal, restart, leave, sendMessage, retry,
} = useTaskHoldemRoom();
const chatDraft = ref("");
const connectionLabel = computed(() => isConnected.value && isLoading.value ? "Syncing room…" : ({ connecting: "Connecting…", connected: "Live", reconnecting: "Reconnecting…", offline: "Offline" })[connection.value]);
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
  border: 1px solid rgb(165 180 252 / 15%);
  border-radius: 1rem;
  color: #e0e7ff;
  background: #0f172a;
  font-size: 2rem;
  font-weight: 600;
}

.intro-card span {
  color: #818cf8;
  font-size: 0.875rem;
}
</style>
