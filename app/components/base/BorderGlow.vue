<!--
  Adapted from Vue Bits BorderGlow at commit 05668fee962070e4edc4c4fbfed53893d7987d6d.
  Copyright (c) 2025 David Haz. MIT + Commons Clause License Condition v1.0.
-->
<template>
  <div
    ref="cardRef"
    data-border-glow
    class="relative isolate grid border border-white/15"
    :style="cardStyle"
    @focusin="isHovered = true"
    @focusout="isHovered = false"
    @pointerenter="isHovered = true"
    @pointerleave="isHovered = false"
    @pointermove="handlePointerMove"
  >
    <div class="absolute inset-0 -z-[1] rounded-[inherit]" :style="borderStyle" />
    <div class="absolute inset-0 -z-[1] rounded-[inherit]" :style="fillStyle" />

    <span class="pointer-events-none absolute z-[1] rounded-[inherit]" :style="outerGlowStyle">
      <span class="absolute rounded-[inherit]" :style="innerGlowStyle" />
    </span>

    <div class="relative z-[1] flex flex-col overflow-hidden rounded-[inherit]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

type GlowColors = readonly [string, string, string];

type BorderGlowProps = {
  animated?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
  edgeSensitivity?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  colors?: GlowColors;
  fillOpacity?: number;
};

type AnimationOptions = {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (value: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
};

const props = withDefaults(defineProps<BorderGlowProps>(), {
  animated: false,
  backgroundColor: "#182131",
  borderRadius: 16,
  edgeSensitivity: 30,
  glowRadius: 32,
  glowIntensity: 0.8,
  coneSpread: 25,
  colors: () => ["#818cf8", "#a78bfa", "#6ee7b7"],
  fillOpacity: 0.35,
});

const gradientSettings = [
  { position: "80% 55%", colorIndex: 0 },
  { position: "69% 34%", colorIndex: 1 },
  { position: "8% 6%", colorIndex: 2 },
  { position: "41% 38%", colorIndex: 0 },
  { position: "86% 85%", colorIndex: 1 },
  { position: "82% 18%", colorIndex: 2 },
  { position: "51% 4%", colorIndex: 1 },
] as const;

const cardRef = ref<HTMLDivElement | null>(null);
const isHovered = ref(false);
const cursorAngle = ref(45);
const edgeProximity = ref(0);
const sweepActive = ref(false);
const reducedMotion = ref(false);

const animationFrames = new Set<number>();
const animationTimeouts = new Set<number>();
let intersectionObserver: IntersectionObserver | undefined;
let motionQuery: MediaQueryList | undefined;
let hasAnimated = false;

function parseHsl(value: string): { h: number; s: number; l: number } {
  const match = value.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  const h = match?.[1];
  const s = match?.[2];
  const l = match?.[3];

  if (!h || !s || !l) {
    return { h: 239, s: 84, l: 67 };
  }

  return { h: Number.parseFloat(h), s: Number.parseFloat(s), l: Number.parseFloat(l) };
}

function buildBoxShadow(intensity: number): string {
  const { h, s, l } = parseHsl("239 84 67");
  const base = `${h}deg ${s}% ${l}%`;
  const layers: readonly [number, number, number, number, number, boolean][] = [
    [0, 0, 0, 1, 100, true],
    [0, 0, 1, 0, 60, true],
    [0, 0, 3, 0, 50, true],
    [0, 0, 6, 0, 40, true],
    [0, 0, 15, 0, 30, true],
    [0, 0, 25, 2, 20, true],
    [0, 0, 50, 2, 10, true],
    [0, 0, 1, 0, 60, false],
    [0, 0, 3, 0, 50, false],
    [0, 0, 6, 0, 40, false],
    [0, 0, 15, 0, 30, false],
    [0, 0, 25, 2, 20, false],
    [0, 0, 50, 2, 10, false],
  ];

  return layers
    .map(([x, y, blur, spread, alpha, inset]) => {
      const opacity = Math.min(alpha * intensity, 100);
      return `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${opacity}%)`;
    })
    .join(", ");
}

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

function easeInCubic(value: number): number {
  return value ** 3;
}

function queueAnimationFrame(callback: (timestamp: number) => void): void {
  const frameId = requestAnimationFrame((timestamp) => {
    animationFrames.delete(frameId);
    callback(timestamp);
  });
  animationFrames.add(frameId);
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimationOptions): void {
  const timeoutId = window.setTimeout(() => {
    animationTimeouts.delete(timeoutId);
    const startedAt = performance.now();

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      onUpdate(start + (end - start) * ease(progress));

      if (progress < 1) {
        queueAnimationFrame(tick);
      } else {
        onEnd?.();
      }
    };

    queueAnimationFrame(tick);
  }, delay);
  animationTimeouts.add(timeoutId);
}

function cancelAnimations(): void {
  for (const frameId of animationFrames) {
    cancelAnimationFrame(frameId);
  }
  for (const timeoutId of animationTimeouts) {
    window.clearTimeout(timeoutId);
  }

  animationFrames.clear();
  animationTimeouts.clear();
  sweepActive.value = false;
}

function playIntro(): void {
  if (hasAnimated || reducedMotion.value) {
    return;
  }

  hasAnimated = true;
  sweepActive.value = true;
  cursorAngle.value = 110;

  animateValue({ duration: 500, onUpdate: (value) => (edgeProximity.value = value / 100) });
  animateValue({
    ease: easeInCubic,
    duration: 1500,
    end: 50,
    onUpdate: (value) => (cursorAngle.value = 355 * (value / 100) + 110),
  });
  animateValue({
    ease: easeOutCubic,
    delay: 1500,
    duration: 2250,
    start: 50,
    end: 100,
    onUpdate: (value) => (cursorAngle.value = 355 * (value / 100) + 110),
  });
  animateValue({
    ease: easeInCubic,
    delay: 2500,
    duration: 1500,
    start: 100,
    end: 0,
    onUpdate: (value) => (edgeProximity.value = value / 100),
    onEnd: () => (sweepActive.value = false),
  });
}

function observeIntro(): void {
  const card = cardRef.value;
  if (!props.animated || !card || reducedMotion.value || hasAnimated) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    playIntro();
    return;
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        intersectionObserver?.disconnect();
        playIntro();
      }
    },
    { threshold: 0.2 },
  );
  intersectionObserver.observe(card);
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion.value = event.matches;
  if (event.matches) {
    cancelAnimations();
    intersectionObserver?.disconnect();
  } else {
    observeIntro();
  }
}

function getCenter(element: HTMLElement): readonly [number, number] {
  const { width, height } = element.getBoundingClientRect();
  return [width / 2, height / 2];
}

function handlePointerMove(event: PointerEvent): void {
  const card = cardRef.value;
  if (!card) {
    return;
  }

  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const [centerX, centerY] = getCenter(card);
  const deltaX = x - centerX;
  const deltaY = y - centerY;
  const scaleX = deltaX === 0 ? Number.POSITIVE_INFINITY : centerX / Math.abs(deltaX);
  const scaleY = deltaY === 0 ? Number.POSITIVE_INFINITY : centerY / Math.abs(deltaY);

  edgeProximity.value = Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1);
  if (deltaX === 0 && deltaY === 0) {
    cursorAngle.value = 0;
    return;
  }

  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
  cursorAngle.value = angle < 0 ? angle + 360 : angle;
}

onMounted(() => {
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.value = motionQuery.matches;
  motionQuery.addEventListener("change", handleMotionChange);
  observeIntro();
});

onBeforeUnmount(() => {
  intersectionObserver?.disconnect();
  motionQuery?.removeEventListener("change", handleMotionChange);
  cancelAnimations();
});

const colorSensitivity = computed(() => props.edgeSensitivity + 20);
const isVisible = computed(() => isHovered.value || sweepActive.value);
const borderOpacity = computed(() =>
  isVisible.value ? Math.max(0, (edgeProximity.value * 100 - colorSensitivity.value) / (100 - colorSensitivity.value)) : 0,
);
const glowOpacity = computed(() =>
  isVisible.value ? Math.max(0, (edgeProximity.value * 100 - props.edgeSensitivity) / (100 - props.edgeSensitivity)) : 0,
);
const angle = computed(() => `${cursorAngle.value.toFixed(3)}deg`);
const transition = computed(() => {
  if (reducedMotion.value) {
    return "none";
  }
  return isVisible.value ? "opacity 0.25s ease-out" : "opacity 0.75s ease-in-out";
});
const gradients = computed(() => [
  ...gradientSettings.map(({ position, colorIndex }) => `radial-gradient(at ${position}, ${props.colors[colorIndex]} 0px, transparent 50%)`),
  `linear-gradient(${props.colors[0]} 0 100%)`,
]);
const borderBackground = computed(() => gradients.value.map((gradient) => `${gradient} border-box`));
const fillBackground = computed(() => gradients.value.map((gradient) => `${gradient} padding-box`));

const cardStyle = computed<CSSProperties>(() => ({
  background: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  boxShadow:
    "rgb(0 0 0 / 10%) 0 1px 2px, rgb(0 0 0 / 10%) 0 2px 4px, rgb(0 0 0 / 10%) 0 4px 8px, rgb(0 0 0 / 10%) 0 8px 16px, rgb(0 0 0 / 10%) 0 16px 32px",
  transform: "translate3d(0, 0, 0.01px)",
}));
const borderStyle = computed<CSSProperties>(() => ({
  border: "1px solid transparent",
  background: [
    `linear-gradient(${props.backgroundColor} 0 100%) padding-box`,
    "linear-gradient(rgb(255 255 255 / 0%) 0 100%) border-box",
    ...borderBackground.value,
  ].join(", "),
  maskImage: `conic-gradient(from ${angle.value} at center, black ${props.coneSpread}%, transparent ${props.coneSpread + 15}%, transparent ${100 - props.coneSpread - 15}%, black ${100 - props.coneSpread}%)`,
  WebkitMaskImage: `conic-gradient(from ${angle.value} at center, black ${props.coneSpread}%, transparent ${props.coneSpread + 15}%, transparent ${100 - props.coneSpread - 15}%, black ${100 - props.coneSpread}%)`,
  opacity: borderOpacity.value,
  transition: transition.value,
}));
const fillStyle = computed<CSSProperties>(() => ({
  border: "1px solid transparent",
  background: fillBackground.value.join(", "),
  maskImage: [
    "linear-gradient(to bottom, black, black)",
    "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
    "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
    "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
    `conic-gradient(from ${angle.value} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
  ].join(", "),
  WebkitMaskImage: [
    "linear-gradient(to bottom, black, black)",
    "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
    "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
    "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
    `conic-gradient(from ${angle.value} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
  ].join(", "),
  maskComposite: "subtract, add, add, add",
  WebkitMaskComposite: "source-out, source-over, source-over, source-over",
  mixBlendMode: "soft-light",
  opacity: borderOpacity.value * props.fillOpacity,
  transition: transition.value,
}));
const outerGlowStyle = computed<CSSProperties>(() => ({
  inset: `-${props.glowRadius}px`,
  maskImage: `conic-gradient(from ${angle.value} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
  WebkitMaskImage: `conic-gradient(from ${angle.value} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
  mixBlendMode: "plus-lighter",
  opacity: glowOpacity.value,
  transition: transition.value,
}));
const innerGlowStyle = computed<CSSProperties>(() => ({
  inset: `${props.glowRadius}px`,
  boxShadow: buildBoxShadow(props.glowIntensity),
}));
</script>
