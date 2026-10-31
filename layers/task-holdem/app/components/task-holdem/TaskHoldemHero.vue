<template>
  <section class="holdem-hero relative isolate overflow-hidden px-5 pb-20 pt-36 sm:px-8 sm:pb-28 sm:pt-44">
    <div class="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      <div>
        <div class="flex items-center gap-4"><NuxtImg :src="taskHoldemApplication.faviconDark" alt="" class="size-16 sm:size-20" /><h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">{{ taskHoldemApplication.name }}</h1></div>
        <h2 class="mt-5 text-5xl font-semibold leading-[1.08] tracking-tight text-highlighted sm:text-6xl">Less guesswork.<br><span class="text-primary">More alignment.</span></h2>
        <p class="mt-6 max-w-lg text-base leading-8 text-muted">Good estimates aren't a solo act. Bring your team together for planning poker that makes space for every perspective.</p>
        <BaseSpecularButton :to="taskHoldemApplication.path" :auto-animate="true" class="mt-8" data-testid="task-holdem-launch">
          Start a planning session <UIcon name="i-heroicons-arrow-right" class="size-5 shrink-0" aria-hidden="true" />
        </BaseSpecularButton>
        <p class="mt-4 text-xs text-muted">Free to use. No accounts. Just your team.</p>
      </div>

      <div aria-hidden="true" class="relative mx-auto w-full max-w-lg rounded-3xl border border-default bg-muted/80 p-5 shadow-2xl shadow-indigo-950/20 sm:p-7">
        <div class="mb-8 flex items-center justify-between"><span class="text-xs font-medium text-toned">The next great conversation</span><span class="flex items-center gap-1.5 text-[10px] text-success"><span class="size-1.5 rounded-full bg-success" /> Live</span></div>
        <div class="rounded-2xl border border-primary/10 bg-primary/5 px-5 py-10 text-center">
          <p class="text-[10px] uppercase tracking-[0.2em] text-primary">Independent votes. Shared understanding.</p>
          <div class="my-8 flex justify-center gap-3">
            <div v-for="(card, index) in previewCards" :key="card.name" class="flex flex-col items-center gap-3">
              <div class="relative flex h-24 w-16 items-center justify-center rounded-xl border text-3xl font-semibold" :class="index === 1 ? '-translate-y-2 border-primary/40 bg-primary/15 text-highlighted shadow-xl shadow-primary/10' : 'border-default bg-default text-primary'">
                <TaskHoldemSuit :suit="card.suit" class="absolute left-2 top-2 text-xs" />{{ card.value }}
              </div>
              <span class="text-[11px] text-muted">{{ card.name }}</span>
            </div>
          </div>
          <p class="text-sm font-medium text-default">Everyone has a seat at the table.</p>
        </div>
        <div class="mt-5 flex items-center justify-between text-[10px] text-muted"><span>One link. Your whole team.</span><UIcon name="i-heroicons-lock-closed" class="size-3.5" /></div>
      </div>
    </div>

    <div class="mx-auto mt-20 grid max-w-6xl gap-8 border-t border-default pt-10 sm:mt-24 sm:grid-cols-3">
      <div v-for="feature in features" :key="feature.title">
        <UIcon :name="feature.icon" class="mb-4 size-5 text-primary" aria-hidden="true" />
        <h3 class="text-sm font-medium text-highlighted">{{ feature.title }}</h3>
        <p class="mt-2 text-sm leading-7 text-muted">{{ feature.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TaskHoldemSuit } from "../../utils/task-holdem";

const previewCards = [
  { name: "Alex", value: 5, suit: "clubs" },
  { name: "Sam", value: 8, suit: "hearts" },
  { name: "Jordan", value: 5, suit: "diamonds" },
] satisfies { name: string; value: number; suit: TaskHoldemSuit }[];
const features = [
  { title: "A room in seconds", description: "Create a session and share a single invitation link. Your team is one click away.", icon: "i-heroicons-user-group" },
  { title: "Think independently", description: "Keep votes private until the reveal. Give every opinion the space it deserves.", icon: "i-heroicons-lock-closed" },
  { title: "Find your alignment", description: "Reveal together, discuss the differences, and move into the next round with clarity.", icon: "i-heroicons-sparkles" },
];
</script>

<style scoped>
.holdem-hero::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 70% 30%, rgb(99 102 241 / 10%), transparent 55%);
  pointer-events: none;
  content: "";
}
</style>
