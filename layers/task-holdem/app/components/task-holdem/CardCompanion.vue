<template>
  <div class="flex shrink-0 items-center gap-2" data-testid="card-companion">
    <span v-if="caption" aria-hidden="true" class="hidden max-w-32 text-right text-[11px] leading-4 text-muted sm:block" data-testid="companion-speech">{{ caption }}</span>
    <button
      type="button"
      :aria-label="`Say hello to your ${character.name}`"
      :title="`Say hello to your ${character.name}`"
      :disabled="!active"
      class="grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default"
      @click="greet"
    >
      <TaskHoldemMascot :avatar="avatar" :active="active" :reaction="reaction" class="size-12" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemPhase, TaskHoldemProfile, TaskHoldemVote } from "../../../shared/types/room.type";
import { taskHoldemMascots } from "../../../shared/data/mascots";

const props = defineProps<{ avatar: TaskHoldemProfile["avatar"]; participantId: string; vote: TaskHoldemVote | null; phase: TaskHoldemPhase; active: boolean }>();
const { reaction, greet } = useTaskHoldemMascotReaction(() => props.participantId);
const character = computed(() => taskHoldemMascots[props.avatar]);
// The legacy protocol calls the Unsure card "break" and the Pass card "skip".
const caption = computed(() => {
  if (props.phase !== "voting") return null;
  if (props.vote === "skip") return "A tiny coffee break.";
  if (props.vote === "break") return props.avatar === "robot" ? "Dude... I don't know!" : "Thinking it over.";
  return null;
});
</script>
