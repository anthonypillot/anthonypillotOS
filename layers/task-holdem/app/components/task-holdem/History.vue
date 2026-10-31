<template>
  <USlideover v-model:open="open" title="Session history" description="Revealed rounds, topics and team estimates. Saved with this room." :ui="{ content: 'w-full sm:max-w-lg' }">
    <UButton label="History" icon="i-heroicons-clock" color="neutral" variant="soft">
      History <span class="rounded bg-accented px-1.5 py-0.5 text-[10px] tabular-nums">{{ count }}</span>
    </UButton>
    <template #body>
      <div class="space-y-5">
        <p v-if="loading && entries.length === 0" role="status" class="py-10 text-center text-sm text-muted">Loading round history…</p>
        <div v-else-if="!entries.length && !error" class="rounded-xl border border-dashed border-default px-6 py-12 text-center">
          <UIcon name="i-heroicons-clock" class="size-8 text-primary" />
          <p class="mt-4 text-sm font-medium text-default">Your session story starts here.</p>
          <p class="mt-2 text-xs leading-6 text-muted">Reveal the first round to save its topic and results. Chat messages aren't included.</p>
        </div>
        <ol aria-label="Round history" class="space-y-4">
          <li v-for="entry in entries" :key="entry.id" class="rounded-xl border border-default bg-muted p-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-xs font-medium text-primary">Round {{ entry.number }}</h3>
              <span class="text-xs text-toned">Average: <strong>{{ formatTaskHoldemAverage(entry.average) }}</strong></span>
            </div>
            <p class="mt-3 break-words text-sm font-medium text-highlighted">{{ entry.topic || 'Untitled round' }}</p>
            <dl class="mt-3 space-y-1 text-[11px] text-muted">
              <div class="flex gap-2"><dt>Started</dt><dd><time :datetime="new Date(entry.startedAt).toISOString()">{{ formatDate(entry.startedAt) }}</time></dd></div>
              <div class="flex gap-2"><dt>Revealed</dt><dd><time :datetime="new Date(entry.revealedAt).toISOString()">{{ formatDate(entry.revealedAt) }}</time></dd></div>
            </dl>
            <details class="mt-4 border-t border-default pt-3">
              <summary class="cursor-pointer text-xs text-toned">{{ entry.ballots.length }} {{ entry.ballots.length === 1 ? 'vote' : 'votes' }} · View details</summary>
              <ul class="mt-3 space-y-2" :aria-label="`Round ${entry.number} votes`">
                <li v-for="ballot in entry.ballots" :key="ballot.participantId" class="flex items-center gap-2 text-xs">
                  <TaskHoldemMascot :avatar="ballot.profile.avatar" class="size-8 shrink-0" />
                  <span class="min-w-0 flex-1 truncate text-toned">{{ ballot.profile.name }}</span>
                  <span class="rounded bg-primary/10 px-2 py-1 font-medium text-primary">{{ formatTaskHoldemVote(ballot.value) }}</span>
                </li>
              </ul>
            </details>
          </li>
        </ol>
        <div v-if="error" role="alert" class="rounded-xl border border-warning/20 p-4 text-sm text-warning">
          <p>{{ error }}</p>
          <UButton label="Retry history" color="warning" variant="ghost" size="xs" class="mt-2" @click="fetchHistory(false)" />
        </div>
        <UButton v-if="nextBefore !== null" label="Load older rounds" variant="soft" :loading="loading" class="w-full justify-center" @click="fetchHistory(true)" />
        <p v-if="entries.length" class="text-center text-[11px] text-muted">Times are shown in your local timezone.</p>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { TaskHoldemHistoryEntry, TaskHoldemHistoryPage } from "../../../shared/types/task-holdem.type";
import { formatTaskHoldemAverage, formatTaskHoldemVote } from "../../utils/task-holdem";

const props = defineProps<{ count: number; load: (before?: number) => Promise<TaskHoldemHistoryPage | undefined> }>();
const open = ref(false);
const entries = shallowRef<TaskHoldemHistoryEntry[]>([]);
const nextBefore = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
let requestId = 0;
let disposed = false;
const formatDate = (value: number) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(value);

async function fetchHistory(append: boolean): Promise<void> {
  const before = append ? nextBefore.value ?? undefined : undefined;
  const current = ++requestId;
  loading.value = true;
  error.value = null;
  try {
    const page = await props.load(before);
    if (disposed || current !== requestId) return;
    if (!page) {
      error.value = "We couldn't load this room's history. Check your connection and try again.";
      return;
    }
    entries.value = append ? [...entries.value, ...page.items.filter(item => !entries.value.some(entry => entry.id === item.id))] : page.items;
    nextBefore.value = page.nextBefore;
  } finally {
    if (!disposed && current === requestId) loading.value = false;
  }
}

watch([open, () => props.count], () => { if (open.value) void fetchHistory(false); });
onScopeDispose(() => { disposed = true; });
</script>
