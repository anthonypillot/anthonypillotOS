<template>
  <!-- Header -->
  <BaseHeader />

  <!-- Main content -->
  <main class="flex flex-col gap-y-16" style="min-height: 75dvh">
    <AppLoader v-if="loading" />
    <NuxtPage />
  </main>

  <!-- Footer -->
  <BaseFooter />
</template>

<script setup lang="ts">
const loading = ref<boolean>(true);

/**
 * Used to show/hide the loading indicator,
 * by listening to the Nuxt app events.
 */
const nuxtApp = useNuxtApp();
nuxtApp.hook("page:start", () => {
  loading.value = true;
});
nuxtApp.hook("page:finish", () => {
  loading.value = false;
});

useSeo();
</script>
