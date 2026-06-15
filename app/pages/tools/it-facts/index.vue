<template>
  <div>
    <ItFactsHero @start="onHeroStart" />
    <section class="bg-gray-900 pb-24 sm:pb-32">
      <div class="mx-auto max-w-4xl px-6 lg:px-8">
        <ItFactsGame ref="gameRef" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useSeo({
  title: "IT Facts",
  description: itFactsApplication.description,
  favicon: {
    type: "image/svg",
    href: "/svg/it-facts/logo.svg",
  },
});

type ItFactsGameExposed = { start: () => void; restart: () => void };

const gameRef = ref<ItFactsGameExposed | null>(null);

function onHeroStart(): void {
  gameRef.value?.start();
}
</script>
