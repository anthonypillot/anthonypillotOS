<template>
  <span ref="rootRef" class="stroke-text">
    <span :class="{ 'stroke-text-placeholder': measured }">{{ text }}</span>
    <svg
      class="stroke-text-svg"
      :class="{ 'stroke-text-svg-ready': measured }"
      :viewBox="`-5 -100 ${textWidth + 10} 130`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath :id="wipeId" clipPathUnits="userSpaceOnUse">
          <rect ref="wipeRef" x="-5" y="-100" :width="textWidth + 10" height="130" />
        </clipPath>
      </defs>
      <text ref="strokeRef" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
        <tspan v-for="(character, index) in characters" :key="index" data-stroke-char>{{ character }}</tspan>
      </text>
      <text fill="currentColor" :clip-path="`url(#${wipeId})`">
        <tspan v-for="(character, index) in characters" :key="index">{{ character }}</tspan>
      </text>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { gsap } from "gsap";

// Adapted from Vue Bits: https://vue-bits.dev/text-animations/stroke-text
const props = withDefaults(defineProps<{ text: string; delay?: number }>(), { delay: 0 });

const rootRef = useTemplateRef("rootRef");
const strokeRef = useTemplateRef("strokeRef");
const wipeRef = useTemplateRef("wipeRef");
const wipeId = `stroke-text-wipe-${useId()}`;
const characters = computed(() => Array.from(props.text));
const textWidth = ref(0);
const measured = ref(false);
let motionContext: ReturnType<typeof gsap.matchMedia> | undefined;
let disposed = false;

onMounted(async () => {
  await document.fonts.ready;
  if (disposed || !rootRef.value || !strokeRef.value || !wipeRef.value) return;

  textWidth.value = strokeRef.value.getComputedTextLength();
  if (!textWidth.value) return;
  await nextTick();
  if (disposed) return;

  const root = rootRef.value;
  const wipe = wipeRef.value;
  const strokes = strokeRef.value.querySelectorAll("[data-stroke-char]");
  motionContext = gsap.matchMedia();
  motionContext.add("(prefers-reduced-motion: no-preference)", () => {
    const timeline = gsap.timeline({ paused: true, delay: props.delay });
    gsap.set(strokes, { strokeDasharray: 700, strokeDashoffset: 700 });
    gsap.set(wipe, { attr: { width: 0 } });
    timeline.to(strokes, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out", stagger: 0.05 });
    timeline.to(wipe, { attr: { width: textWidth.value + 10 }, duration: 0.8, ease: "power2.inOut" }, 1.8);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          timeline.play();
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  });
  measured.value = true;
});

onBeforeUnmount(() => {
  disposed = true;
  motionContext?.revert();
});
</script>

<style scoped>
.stroke-text {
  position: relative;
  display: inline-block;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.3;
  white-space: pre;
}

.stroke-text-placeholder {
  opacity: 0;
}

.stroke-text-svg {
  position: absolute;
  top: 0;
  left: -0.05em;
  width: calc(100% + 0.1em);
  height: 100%;
  overflow: visible;
  visibility: hidden;
}

.stroke-text-svg text {
  font-size: 100px;
  letter-spacing: -4px;
}

.stroke-text-svg-ready {
  visibility: visible;
}
</style>
