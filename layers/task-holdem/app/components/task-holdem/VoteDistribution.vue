<template>
  <section aria-label="Vote distribution" class="mt-6 w-full max-w-sm text-left">
    <h4 class="text-xs font-medium text-default">Vote distribution</h4>
    <p class="mt-1 text-xs leading-5 text-muted">{{ summary.total }} votes cast · {{ summary.numeric }} numeric · {{ summary.pass }} Pass · {{ summary.unsure }} Unsure</p>
    <ol aria-label="Votes by card" class="mt-3 space-y-2">
      <li v-for="group in summary.distribution" :key="group.value" class="flex items-center gap-3 text-xs" :aria-label="`${formatTaskHoldemVote(group.value)}: ${group.count} ${group.count === 1 ? 'vote' : 'votes'}`">
        <span class="w-12 shrink-0 font-medium text-toned">{{ formatTaskHoldemVote(group.value) }}</span>
        <span aria-hidden="true" class="h-2 flex-1 overflow-hidden rounded-full bg-accented"><span class="block h-full rounded-full bg-primary" :style="{ width: `${group.count / summary.total * 100}%` }" /></span>
        <span class="w-5 text-right tabular-nums text-default">{{ group.count }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { TaskHoldemBallot } from "../../../shared/types/room.type";
import { formatTaskHoldemVote } from "../../utils/cards";
import { getTaskHoldemVoteSummary } from "../../utils/results";

const props = defineProps<{ ballots: TaskHoldemBallot[] }>();
const summary = computed(() => getTaskHoldemVoteSummary(props.ballots.map(ballot => ballot.value)));
</script>
