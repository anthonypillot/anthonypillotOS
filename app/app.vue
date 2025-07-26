<template>
  <!-- Header -->
  <BaseHeader />

  <!-- Main content -->
  <main class="flex flex-col gap-y-16" style="min-height: 75dvh">
    <NuxtPage />
  </main>

  <!-- Footer -->
  <BaseFooter />
</template>

<script setup lang="ts">
useSeo();
</script>
