<!--
Adapted from Vue Bits SpecularButton at commit 3766ebeeed37ec35bce29f001b6d101c7b17da35.
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
  <NuxtLink v-slot="{ href, navigate }" :to="to" custom>
    <a
      ref="buttonElement"
      v-bind="$attrs"
      :href="href ?? undefined"
      class="specular-button"
      :data-auto-animate="autoAnimate"
      :data-effect="effectState"
      @click="navigate"
    >
      <span ref="effectElement" class="specular-effects" aria-hidden="true" />
      <span class="specular-label"><slot /></span>
    </a>
  </NuxtLink>
</template>

<script setup lang="ts">
import { Mesh, Program, Renderer, Triangle } from "ogl";

defineOptions({ inheritAttrs: false });

type SpecularButtonProps = { to: string; autoAnimate?: boolean };

const props = withDefaults(defineProps<SpecularButtonProps>(), { autoAnimate: false });
const buttonElement = useTemplateRef<HTMLAnchorElement>("buttonElement");
const effectElement = useTemplateRef<HTMLSpanElement>("effectElement");
const effectState = ref<"static" | "animated" | "unavailable">("static");
let dispose = () => {};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;
out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = sdRoundedRect(p, uHalfSize, uRadius);
  vec2 light = vec2(cos(uAngle), sin(uAngle));
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;
  vec2 normal = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(normal, light)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float highlight = line * rim * edgeClamp * uIntensity;
  vec3 color = uBaseColor * base + uLineColor * highlight;
  fragColor = vec4(color, clamp(base + highlight, 0.0, 1.0));
}
`;

function mountEffect(button: HTMLAnchorElement, effect: HTMLSpanElement): void {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!context) {
    effectState.value = "unavailable";
    return;
  }

  const events = new AbortController();
  const cleanups: (() => void)[] = [];
  let frame = 0;
  let available = true;
  dispose = () => {
    if (!available) return;
    available = false;
    cancelAnimationFrame(frame);
    events.abort();
    for (const cleanup of cleanups.reverse()) cleanup();
    canvas.remove();
    context.getExtension("WEBGL_lose_context")?.loseContext();
  };

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new Renderer({ canvas, dpr, alpha: true, antialias: true, premultipliedAlpha: true });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const geometry = new Triangle(gl);
  if (geometry.attributes.uv) delete geometry.attributes.uv;
  cleanups.push(() => geometry.remove());
  const uniforms = {
    uCenter: { value: [0, 0] },
    uHalfSize: { value: [1, 1] },
    uRadius: { value: 18 * dpr },
    uAngle: { value: 2.4 },
    uPx: { value: dpr },
    uLineColor: { value: [1, 1, 1] },
    uBaseColor: { value: [0.32, 0.32, 0.32] },
    uIntensity: { value: 1 },
    uShineSize: { value: 10 * Math.PI / 180 },
    uShineFade: { value: 40 * Math.PI / 180 },
    uThickness: { value: dpr },
    uBaseWidth: { value: dpr },
  };
  const program = new Program(gl, { vertex, fragment, uniforms });
  cleanups.push(() => program.remove());
  const mesh = new Mesh(gl, { geometry, program });
  effect.appendChild(canvas);

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let contextLost = false;
  let width = 1;
  let height = 1;
  let pointerAngle: number | null = null;
  let proximity = 0;
  let angle = 2.4;
  let idleAngle = 2.4;
  let brightness = props.autoAnimate ? 1 : 0;
  let lastTime = performance.now();

  function draw(now: number): void {
    const dt = motion.matches ? 0 : Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    idleAngle += 0.35 * dt;
    const target = pointerAngle !== null && (!props.autoAnimate || proximity > 0) ? pointerAngle : idleAngle;
    const difference = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    angle += difference * (1 - Math.exp(-dt * 7));
    const targetBrightness = props.autoAnimate ? 1 : proximity;
    brightness = motion.matches ? targetBrightness : brightness + (targetBrightness - brightness) * (1 - Math.exp(-dt * 8));
    uniforms.uAngle.value = angle;
    uniforms.uRadius.value = Math.min(18, width / 2, height / 2) * dpr;
    uniforms.uIntensity.value = brightness;
    renderer.render({ scene: mesh });
  }

  function tick(now: number): void {
    draw(now);
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!available || contextLost) return;
    effectState.value = "static";
    if (!visible || document.hidden) return;
    lastTime = performance.now();
    if (motion.matches) draw(lastTime);
    else {
      effectState.value = "animated";
      frame = requestAnimationFrame(tick);
    }
  }

  function resize(): void {
    if (!available || contextLost) return;
    const bounds = button.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return;
    renderer.setSize(width + 40, height + 40);
    uniforms.uCenter.value = [(20 + width / 2) * dpr, (20 + height / 2) * dpr];
    uniforms.uHalfSize.value = [width / 2 * dpr, height / 2 * dpr];
    syncPlayback();
  }

  function onPointerMove(event: PointerEvent): void {
    if (!visible || document.hidden || motion.matches || contextLost) return;
    const bounds = button.getBoundingClientRect();
    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    const dx = Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right);
    const dy = Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom);
    const distance = Math.hypot(dx, dy);
    pointerAngle = distance === 0
      ? Math.atan2(2 / bounds.height, -2 / bounds.width) + (event.clientX - cx) / (bounds.width / 2) * 0.3 + (cy - event.clientY) / (bounds.height / 2) * 0.15
      : Math.atan2(cy - event.clientY, event.clientX - cx);
    const t = Math.max(0, 1 - distance / 250);
    proximity = t * t * (3 - 2 * t);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(button);
  cleanups.push(() => resizeObserver.disconnect());
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    syncPlayback();
  });
  intersectionObserver.observe(button);
  cleanups.push(() => intersectionObserver.disconnect());
  window.addEventListener("pointermove", onPointerMove, { passive: true, signal: events.signal });
  document.addEventListener("visibilitychange", syncPlayback, { signal: events.signal });
  motion.addEventListener("change", syncPlayback, { signal: events.signal });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    effectState.value = "unavailable";
    canvas.remove();
  }, { signal: events.signal });
  cleanups.push(watch(() => props.autoAnimate, syncPlayback));
  resize();
}

onMounted(() => {
  if (!buttonElement.value || !effectElement.value) return;
  try {
    mountEffect(buttonElement.value, effectElement.value);
  } catch {
    dispose();
    effectState.value = "unavailable";
  }
});

onScopeDispose(() => dispose());
</script>

<style scoped>
.specular-button {
  position: relative;
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  padding: 1.125rem 2.5rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 18px;
  color: var(--ui-text-highlighted);
  background: color-mix(in srgb, var(--ui-bg) 80%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 4%), 0 8px 24px rgb(0 0 0 / 25%);
  font-size: 1.15rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  transition: transform 150ms ease;
}
.specular-button:active { transform: scale(0.97); }
.specular-button:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 4px; }
.specular-effects { position: absolute; z-index: 0; inset: -20px; pointer-events: none; }
.specular-effects :deep(canvas) { display: block; width: 100%; height: 100%; }
.specular-label { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
@media (prefers-reduced-motion: reduce) {
  .specular-button { transition: none; }
  .specular-button:active { transform: none; }
}
</style>
