<template>
  <section class="lg:pt-32">
    <MyStackHero />
  </section>
  <MyStackApplicationArchitecture />
  <MyStackInfrastructure />
  <MyStackMonitoringAnalytics />
  <MyStackOpenSourceTools />
  <MyStackPhilosophy />
  <MyStackTechnologyArsenal />
</template>

<script setup lang="ts">
const description =
  "Discover the technology stack powering anthonypillotOS: Nuxt 4, Vue 3, TypeScript, Kubernetes, Socket.io, and more. A deep dive into modern web development architecture.";

useSeo({
  title: "My Stack",
  description,
});
</script>
