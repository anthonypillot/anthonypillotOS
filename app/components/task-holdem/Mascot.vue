<template>
  <svg
    viewBox="-1 -2 18 20"
    fill="none"
    shape-rendering="crispEdges"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="!label || undefined"
    :data-mascot="avatar"
    class="mascot shrink-0 overflow-visible"
    :class="{ 'mascot-voted': voted, 'mascot-celebrating': celebrating }"
  >
    <ellipse cx="8" cy="16.5" rx="5" ry="0.5" :fill="taskHoldemMascots[avatar].color" opacity="0.15" />
    <g class="mascot-reaction">
      <g class="mascot-idle">
        <path v-for="(part, index) in paths" :key="index" :d="part.path" :fill="part.color" :class="{ 'mascot-eyes': part.eyes }" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { TaskHoldemProfile } from "#shared/types/task-holdem.type";
import { taskHoldemMascots } from "#shared/data/task-holdem-mascots";
import { getTaskHoldemMascotPaths } from "~/utils/task-holdem-mascots";

const props = withDefaults(defineProps<{ avatar: TaskHoldemProfile["avatar"]; label?: string; voted?: boolean; celebrating?: boolean }>(), {
  label: "", voted: false, celebrating: false,
});
const paths = computed(() => getTaskHoldemMascotPaths(props.avatar));
</script>

<style scoped>
.mascot { image-rendering: pixelated; }
.mascot-idle { animation: mascot-float 2.8s steps(2, end) infinite; }
.mascot-eyes { transform-box: fill-box; transform-origin: center; animation: mascot-blink 5.2s step-end infinite; }
.mascot-reaction { transform-origin: 50% 80%; }
.mascot-voted .mascot-reaction { animation: mascot-bounce 400ms steps(3, end); }
.mascot-celebrating .mascot-reaction { animation: mascot-cheer 650ms steps(4, end); }
@keyframes mascot-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-0.75px); } }
@keyframes mascot-blink { 0%, 42%, 48%, 100% { transform: scaleY(1); } 44%, 46% { transform: scaleY(0.1); } }
@keyframes mascot-bounce { 0%, 100% { transform: translateY(0); } 45% { transform: translateY(-2px); } }
@keyframes mascot-cheer { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-8deg) translateY(-1px); } 75% { transform: rotate(8deg) translateY(-1px); } }
@media (prefers-reduced-motion: reduce) {
  .mascot-idle, .mascot-eyes, .mascot-reaction { animation: none !important; }
}
</style>
