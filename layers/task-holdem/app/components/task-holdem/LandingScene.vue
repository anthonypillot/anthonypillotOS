<template>
  <div ref="root" aria-hidden="true" class="landing-scene pointer-events-none relative mx-auto w-full max-w-lg text-center" data-testid="task-holdem-preview" :data-running="running">
    <div class="scene-stage">
      <div class="scene-table" />
      <div class="scene-players">
        <div v-for="player in players" :key="player.name" class="scene-player" data-testid="preview-player">
          <div class="scene-bubble text-xs font-medium text-toned" data-testid="preview-speech">{{ player.speech }}</div>
          <TaskHoldemMascot :avatar="player.avatar" class="scene-mascot" />
          <span class="scene-name text-xs text-muted">{{ player.name }}</span>
          <div class="scene-card relative flex items-center justify-center rounded-xl border text-3xl font-semibold text-highlighted" data-testid="preview-card">
            <TaskHoldemSuit :suit="player.suit" class="absolute left-2 top-2 text-[10px]" />
            <span>{{ player.value }}</span>
            <span class="absolute bottom-2 right-2 h-px w-2 bg-primary/40" />
          </div>
        </div>
      </div>
    </div>
    <p class="mt-3 text-sm font-medium text-default">Everyone has a seat at the table.</p>
  </div>
</template>

<script setup lang="ts">
import type { TaskHoldemProfile } from "../../../shared/types/room.type";
import type { TaskHoldemSuit } from "../../utils/cards";

type PreviewPlayer = { name: string; avatar: TaskHoldemProfile["avatar"]; value: number; suit: TaskHoldemSuit; speech: string };

const players = [
  { name: "Anthony", avatar: "cowboy", value: 5, suit: "clubs", speech: "A 5 for me." },
  { name: "Élise", avatar: "princess", value: 8, suit: "hearts", speech: "Hmm… maybe 8?" },
  { name: "Raphaël", avatar: "robot", value: 5, suit: "diamonds", speech: "Dude... I don't know!" },
] satisfies PreviewPlayer[];
const root = useTemplateRef<HTMLDivElement>("root");
const visible = ref(false);
const pageVisible = ref(true);
const running = computed(() => visible.value && pageVisible.value);
let observer: IntersectionObserver | undefined;

function updateVisibility(): void {
  pageVisible.value = document.visibilityState === "visible";
}

onMounted(() => {
  updateVisibility();
  document.addEventListener("visibilitychange", updateVisibility);
  if (typeof IntersectionObserver === "undefined") {
    visible.value = true;
    return;
  }
  observer = new IntersectionObserver(([entry]) => { visible.value = entry?.isIntersecting ?? false; });
  if (root.value) observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  document.removeEventListener("visibilitychange", updateVisibility);
});
</script>

<style scoped>
.landing-scene { container-type: inline-size; }
.scene-stage { position: relative; padding: 3rem 0 1.5rem; }
.scene-stage::before {
  position: absolute;
  inset: 12% -5% -8%;
  z-index: -1;
  background: radial-gradient(ellipse at 50% 65%, color-mix(in oklab, var(--ui-primary) 12%, transparent), transparent 65%);
  content: "";
}
.scene-table {
  position: absolute;
  inset: auto 0 1.75rem;
  height: clamp(8rem, 32cqi, 10rem);
  border: 1px solid color-mix(in oklab, var(--ui-primary) 22%, transparent);
  border-radius: 50%;
  background: linear-gradient(180deg, color-mix(in oklab, var(--ui-primary) 8%, var(--ui-bg)), var(--ui-bg));
  box-shadow: 0 18px 0 -12px color-mix(in oklab, var(--ui-primary) 9%, var(--ui-bg)), 0 28px 35px -24px color-mix(in oklab, var(--ui-primary) 25%, transparent);
}
.scene-table::after {
  position: absolute;
  inset: 10px 14px;
  border: 1px dashed color-mix(in oklab, var(--ui-primary) 16%, transparent);
  border-radius: inherit;
  content: "";
}
.scene-players {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.375rem, 3cqi, 1rem);
  padding-inline: clamp(0.25rem, 3cqi, 1rem);
}
.scene-player {
  --seat-tilt: -10deg;
  --speech-tilt: -4deg;
  --speech-delay: 0s;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
}
.scene-player:nth-child(2) {
  --seat-tilt: 0deg;
  --speech-tilt: 2deg;
  --speech-delay: -2s;
  transform: translateY(-2rem);
}
.scene-player:nth-child(3) {
  --seat-tilt: 10deg;
  --speech-tilt: 4deg;
  --speech-delay: -4s;
}
.scene-bubble {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 1rem;
  background: var(--ui-bg-elevated);
  box-shadow: 0 8px 24px -16px color-mix(in oklab, var(--ui-primary) 35%, transparent);
  line-height: 1.4;
  transform: rotate(var(--speech-tilt));
  animation: scene-conversation 6s ease-in-out infinite;
  animation-delay: var(--speech-delay);
  animation-play-state: paused;
}
.scene-bubble::after {
  position: absolute;
  bottom: -5px;
  left: calc(50% - 5px);
  width: 9px;
  height: 9px;
  border-right: 1px solid var(--ui-border-accented);
  border-bottom: 1px solid var(--ui-border-accented);
  background: var(--ui-bg-elevated);
  transform: rotate(45deg);
  content: "";
}
.scene-mascot { width: clamp(3.5rem, 17cqi, 5.5rem); height: clamp(4rem, 19cqi, 6rem); margin-top: 1.25rem; }
.scene-name { margin-top: 0.25rem; }
.scene-card {
  width: clamp(3.25rem, 13cqi, 4rem);
  height: clamp(4.25rem, 18cqi, 5.5rem);
  margin-top: 1.5rem;
  border-color: color-mix(in oklab, var(--ui-primary) 28%, var(--ui-border));
  background: var(--ui-bg-elevated);
  box-shadow: 0 6px 0 -2px var(--ui-bg), 0 8px 0 -2px color-mix(in oklab, var(--ui-primary) 20%, var(--ui-border)), 0 14px 24px -12px color-mix(in oklab, var(--ui-primary) 30%, transparent);
  transform: rotate(var(--seat-tilt));
}
.scene-player:nth-child(2) .scene-card { border-color: color-mix(in oklab, var(--ui-primary) 65%, transparent); background: color-mix(in oklab, var(--ui-primary) 12%, var(--ui-bg-elevated)); }
.landing-scene :deep(.mascot-idle),
.landing-scene :deep(.mascot-eyes) { animation-play-state: paused; }
.landing-scene[data-running="true"] .scene-bubble,
.landing-scene[data-running="true"] :deep(.mascot-idle),
.landing-scene[data-running="true"] :deep(.mascot-eyes) { animation-play-state: running; }

@keyframes scene-conversation {
  0%, 100% { transform: translateY(0) rotate(var(--speech-tilt)); }
  50% { transform: translateY(-4px) rotate(var(--speech-tilt)); }
}

@media (prefers-reduced-motion: reduce) {
  .scene-bubble { animation: none; }
}
</style>
