<template>
  <div class="flex shrink-0 items-center gap-2" data-testid="card-companion">
    <span v-if="caption" aria-hidden="true" class="hidden max-w-32 text-right text-[11px] leading-4 text-muted sm:block" data-testid="companion-speech">{{ caption }}</span>
    <button
      type="button"
      :aria-label="`Say hello to your ${character.name}`"
      :title="`Say hello to your ${character.name}`"
      :disabled="!active"
      class="grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default"
      @click="sayHello"
    >
      <TaskHoldemMascot ref="mascot" :avatar="avatar" :active="active" class="companion-sprite size-12" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemPhase, TaskHoldemProfile, TaskHoldemVote } from "../../../shared/types/room.type";
import { taskHoldemMascots } from "../../../shared/data/mascots";
import type Mascot from "./Mascot.vue";

const props = defineProps<{ avatar: TaskHoldemProfile["avatar"]; vote: TaskHoldemVote | null; roundId: string; phase: TaskHoldemPhase; active: boolean }>();
const mascot = useTemplateRef<InstanceType<typeof Mascot>>("mascot");
const character = computed(() => taskHoldemMascots[props.avatar]);
// The legacy protocol calls the Unsure card "break" and the Pass card "skip".
const caption = computed(() => {
  if (props.phase !== "voting") return null;
  if (props.vote === "skip") return "A tiny coffee break.";
  if (props.vote === "break") return props.avatar === "robot" ? "Dude... I don't know!" : "Thinking it over.";
  return null;
});
let lastHello = -Infinity;

function sayHello(): void {
  if (!props.active || Date.now() - lastHello < 8000) return;
  if (mascot.value?.play(props.avatar === "robot" ? "moonwalk" : "mischief")) lastHello = Date.now();
}

watch([() => props.roundId, () => props.phase, () => props.vote, () => props.active], ([roundId, phase, vote, active], [previousRound, previousPhase, previousVote, wasActive]) => {
  if (!active || !wasActive) return;
  if (roundId !== previousRound) {
    if (phase === "voting") mascot.value?.play("signature");
  } else if (phase !== previousPhase) {
    if (phase === "revealed") mascot.value?.play("reveal");
  } else if (phase === "voting" && vote !== previousVote && vote !== null) {
    mascot.value?.play(vote === "break" ? "think" : vote === "skip" ? "break" : "vote");
  }
});
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .companion-sprite[data-motion="moonwalk"] { animation: companion-moonwalk 1.8s steps(5, end); }
}
@keyframes companion-moonwalk {
  0%, 100% { transform: translateX(0); }
  35% { transform: translateX(-9px); }
  70% { transform: translateX(6px); }
}
</style>
