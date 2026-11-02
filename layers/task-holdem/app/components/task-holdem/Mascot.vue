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

const props = withDefaults(defineProps<{ avatar: TaskHoldemProfile["avatar"]; label?: string; voted?: boolean; celebrating?: boolean; active?: boolean; ambient?: boolean; presenting?: boolean }>(), {
  label: "", voted: false, celebrating: false, active: true, ambient: true, presenting: false,
});
const emit = defineEmits<{ "motion-end": [motion: TaskHoldemMascotMotion] }>();
const root = useTemplateRef<SVGSVGElement>("root");
const { pose, motion, running, play } = useTaskHoldemMascot({ root, avatar: () => props.avatar, active: () => props.active, ambient: () => props.ambient });
const paths = computed(() => getTaskHoldemMascotPaths(props.avatar, pose.value));

watch(() => props.voted, (value, previous) => { if (value && !previous) play("vote"); });
watch(() => props.celebrating, (value, previous) => { if (value && !previous) play("reveal"); });
watch(() => props.presenting, (value, previous) => { if (value && !previous) play("signature"); });
watch(motion, (value, previous) => { if (value === "rest" && previous !== "rest") emit("motion-end", previous); });

defineExpose({ play });
</script>

<style scoped>
.mascot { image-rendering: pixelated; }
</style>
