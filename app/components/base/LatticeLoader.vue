<!--
Adapted from Vue Bits LatticeLoader at commit 66954e91a3f821ae66c9e78bbe2c4e33bac45fe2.
https://vue-bits.dev/micro/lattice-loader
MIT + Commons Clause License Condition v1.0
Copyright (c) 2025 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software as part of
an application, website, or product, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

You may use this Software, including for any commercial purpose, so long as
you do not sell, sublicense, or redistribute the components themselves-whether
alone, in a bundle, template, or as a ported version.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->
<template>
  <span ref="root" class="lattice-loader inline-flex items-center gap-1.5 text-xs text-muted" :data-status="status" :data-running="running" :style="{ '--lattice-cycle': `${step * 8}ms` }" role="status" aria-live="polite" aria-atomic="true">
    <span class="lattice-grid" aria-hidden="true">
      <span class="lattice-run">
        <span v-for="(unit, index) in orbit" :key="index" class="lattice-cell" :class="{ 'lattice-hole': unit === null }" :style="unit === null ? undefined : { animationDelay: `${unit * step}ms` }" />
      </span>
      <span class="lattice-mark">
        <span v-for="(_, index) in orbit" :key="index" class="lattice-cell" :data-on="checkCells.includes(index)" />
      </span>
    </span>
    <span aria-hidden="true">{{ label }}</span>
    <span class="sr-only">{{ announcement ?? label }}</span>
  </span>
</template>

<script setup lang="ts">
type LatticeLoaderProps = {
  status: "working" | "done";
  label: string;
  announcement?: string;
};

const props = defineProps<LatticeLoaderProps>();
const orbit = [0, 1, 2, 7, null, 3, 6, 5, 4];
const checkCells = [2, 3, 5, 7];
const step = 108;
const root = useTemplateRef<HTMLSpanElement>("root");
const visible = ref(false);
const pageVisible = ref(true);
const running = computed(() => props.status === "working" && visible.value && pageVisible.value);
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
.lattice-grid,
.lattice-run,
.lattice-mark { display: grid; }
.lattice-grid { flex-shrink: 0; }
.lattice-run,
.lattice-mark {
  grid-area: 1 / 1;
  grid-template-columns: repeat(3, 3px);
  gap: 2px;
  transition: opacity 180ms ease;
}
.lattice-cell {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--ui-primary);
  opacity: 0.15;
}
.lattice-run .lattice-cell:not(.lattice-hole) {
  animation: lattice-orbit var(--lattice-cycle) cubic-bezier(0.77, 0, 0.175, 1) infinite;
  animation-play-state: paused;
}
.lattice-hole { opacity: 0.07; }
.lattice-loader[data-running="true"] .lattice-run .lattice-cell { animation-play-state: running; }
.lattice-mark { opacity: 0; }
.lattice-mark .lattice-cell { background: var(--ui-success); }
.lattice-mark .lattice-cell[data-on="true"] { opacity: 1; }
.lattice-loader[data-status="done"] .lattice-run { opacity: 0; }
.lattice-loader[data-status="done"] .lattice-mark { opacity: 1; }

@keyframes lattice-orbit {
  0%, 62%, 100% { opacity: 0.15; }
  18%, 42% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .lattice-run,
  .lattice-mark { transition: none; }
  .lattice-run .lattice-cell:not(.lattice-hole) { animation: none; opacity: 0.6; }
}
</style>
