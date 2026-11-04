<template>
  <svg
    ref="root"
    viewBox="-1 -2 18 20"
    fill="none"
    shape-rendering="crispEdges"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="!label || undefined"
    :data-mascot="avatar"
    :data-pose="pose"
    :data-motion="motion"
    :data-running="running"
    class="mascot shrink-0 overflow-visible"
  >
    <ellipse cx="8" cy="16.5" rx="5" ry="0.5" :fill="taskHoldemMascots[avatar].color" opacity="0.15" />
    <g class="mascot-sprite">
      <path v-for="part in paths" :key="part.ink" :d="part.path" :fill="part.color" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { TaskHoldemProfile } from "../../../shared/types/room.type";
import { taskHoldemMascots } from "../../../shared/data/mascots";
import { getTaskHoldemMascotPaths } from "../../utils/mascots";
import type { TaskHoldemMascotMotion } from "../../utils/mascot-motion";
import type { TaskHoldemMascotReaction } from "../../utils/mascot-reactions";

const props = withDefaults(defineProps<{ avatar: TaskHoldemProfile["avatar"]; label?: string; voted?: boolean; celebrating?: boolean; active?: boolean; ambient?: boolean; presenting?: boolean; reaction?: TaskHoldemMascotReaction | null }>(), {
  label: "", voted: false, celebrating: false, active: true, ambient: true, presenting: false, reaction: null,
});
const emit = defineEmits<{ "motion-end": [motion: TaskHoldemMascotMotion] }>();
const root = useTemplateRef<SVGSVGElement>("root");
const { pose, motion, running, play } = useTaskHoldemMascot({ root, avatar: () => props.avatar, active: () => props.active, ambient: () => props.ambient });
const paths = computed(() => getTaskHoldemMascotPaths(props.avatar, pose.value));

watch(() => props.voted, (value, previous) => { if (value && !previous) play("vote", "passive"); });
watch(() => props.celebrating, (value, previous) => { if (value && !previous) play("reveal", "passive"); });
watch(() => props.presenting, (value, previous) => { if (value && !previous) play("signature"); });
watch(() => props.reaction, (value) => { if (value) play(value.motion, value.kind); });
watch(motion, (value, previous) => { if (value === "rest" && previous !== "rest") emit("motion-end", previous); });

defineExpose({ play });
</script>

<style scoped>
.mascot { image-rendering: pixelated; }
@media (prefers-reduced-motion: no-preference) {
  .mascot[data-motion="moonwalk"] { animation: mascot-moonwalk 1.8s steps(5, end); }
}
@keyframes mascot-moonwalk {
  0%, 100% { transform: translateX(0); }
  35% { transform: translateX(-9px); }
  70% { transform: translateX(6px); }
}
</style>
