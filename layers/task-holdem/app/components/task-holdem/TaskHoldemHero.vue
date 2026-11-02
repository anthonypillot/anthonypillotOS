<template>
  <section class="holdem-hero relative isolate overflow-hidden px-5 pb-20 pt-36 sm:px-8 sm:pb-28 sm:pt-44">
    <div class="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      <div class="text-center lg:text-left">
        <div class="flex items-center justify-center gap-4 lg:justify-start"><NuxtImg :src="taskHoldemApplication.faviconDark" alt="" class="size-16 sm:size-20" /><h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">{{ taskHoldemApplication.name }}</h1></div>
        <h2 class="mt-5 text-5xl font-semibold leading-[1.08] tracking-tight text-highlighted sm:text-6xl">Less guesswork.<br><span class="text-primary">More alignment.</span></h2>
        <p class="mx-auto mt-6 max-w-lg text-base leading-8 text-muted lg:mx-0">Good estimates aren't a solo act. Bring your team together for planning poker that makes space for every perspective.</p>
        <BaseSpecularButton :to="taskHoldemApplication.path" :auto-animate="true" class="mt-8" data-testid="task-holdem-launch">
          Start a planning session
        </BaseSpecularButton>
      </div>

      <TaskHoldemLandingScene />
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
