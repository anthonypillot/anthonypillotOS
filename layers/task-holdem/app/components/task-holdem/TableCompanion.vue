<template>
  <div ref="root" aria-hidden="true" class="table-companion pointer-events-none absolute right-3 top-2 h-14 w-14 sm:right-5" :data-appearance="show ? appearance : 'none'" :data-running="running" data-testid="table-companion">
    <div class="relative h-full overflow-hidden">
      <div class="cameo absolute inset-0" :class="show ? 'opacity-100' : 'opacity-0'">
        <TaskHoldemMascot ref="mascot" :avatar="avatar" :active="show && active" :ambient="false" class="cameo-sprite absolute left-0 top-2 size-14" @motion-end="finish" />
        <span v-if="appearance === 'card'" class="absolute bottom-0 left-1 flex h-8 w-6 -rotate-12 items-center justify-center rounded border border-primary/30 bg-elevated text-xs font-semibold text-primary">?</span>
      </div>
    </div>
    <span v-if="show" class="absolute inset-x-1 bottom-0 h-px bg-primary/30" />
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemPhase, TaskHoldemProfile } from "../../../shared/types/room.type";
import { taskHoldemAvatarSchema } from "../../../shared/schemas/room.schema";
import { taskHoldemMascotMotions, type TaskHoldemMascotMotion } from "../../utils/mascot-motion";
import type Mascot from "./Mascot.vue";

type Appearance = "peek" | "card" | "moonwalk";

const props = defineProps<{ roundId: string; phase: TaskHoldemPhase; active: boolean }>();
const root = useTemplateRef<HTMLDivElement>("root");
const mascot = useTemplateRef<InstanceType<typeof Mascot>>("mascot");
const running = useTaskHoldemMascotVisibility(root, () => props.active);
const show = ref(false);
const appearance = ref<Appearance>("peek");
const avatar = ref<TaskHoldemProfile["avatar"]>("cowboy");
let previous: Appearance | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let finishTimer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;
let appeared = false;

function schedule(delay = appeared ? 70_000 + Math.random() * 40_000 : 20_000 + Math.random() * 15_000): void {
  clearTimeout(timer);
  if (running.value && props.phase !== "revealing") timer = setTimeout(appear, delay);
}

function finish(): void {
  if (!show.value) return;
  show.value = false;
  clearTimeout(finishTimer);
  schedule();
}

async function appear(): Promise<void> {
  if (!running.value || props.phase === "revealing") return;
  const currentGeneration = generation;
  const choices = (["peek", "card", "moonwalk"] satisfies Appearance[]).filter(choice => choice !== previous);
  appearance.value = choices[Math.floor(Math.random() * choices.length)] ?? "peek";
  const avatars = taskHoldemAvatarSchema.options.filter(value => value !== avatar.value);
  avatar.value = appearance.value === "moonwalk" ? "robot" : appearance.value === "peek" ? "cowboy" : avatars[Math.floor(Math.random() * avatars.length)] ?? "princess";
  show.value = true;
  await nextTick();
  if (currentGeneration !== generation || !running.value) return;
  const motion: TaskHoldemMascotMotion = appearance.value === "moonwalk" ? "moonwalk" : appearance.value === "card" ? "mischief" : "signature";
  if (!mascot.value?.play(motion, "secret")) {
    show.value = false;
    schedule(15_000 + Math.random() * 15_000);
    return;
  }
  appeared = true;
  previous = appearance.value;
  const duration = taskHoldemMascotMotions[motion].reduce((total, frame) => total + frame.duration, 0);
  finishTimer = setTimeout(finish, duration + 100);
}

watch([running, () => props.roundId, () => props.phase], ([visible, roundId, phase], [wasVisible, previousRound, previousPhase]) => {
  generation++;
  clearTimeout(timer);
  clearTimeout(finishTimer);
  show.value = false;
  if (!visible || phase === "revealing") return;
  if (wasVisible && (roundId !== previousRound || (phase === "revealed" && phase !== previousPhase))) schedule(2200 + Math.random() * 1200);
  else schedule();
});
onScopeDispose(() => {
  generation++;
  clearTimeout(timer);
  clearTimeout(finishTimer);
});
</script>

<style scoped>
.cameo { transition: opacity 160ms steps(2, end); }
.table-companion[data-appearance="moonwalk"] .cameo-sprite { animation: table-moonwalk 1.8s steps(6, end); }
@keyframes table-moonwalk {
  0%, 100% { transform: translateX(0); }
  35% { transform: translateX(-8px); }
  70% { transform: translateX(8px); }
}
@media (prefers-reduced-motion: reduce) {
  .cameo { transition: none; }
  .cameo-sprite { animation: none !important; }
}
</style>
