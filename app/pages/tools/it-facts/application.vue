<template>
  <section class="bg-gray-900 mt-28">
    <div class="mx-auto max-w-4xl px-6 lg:px-8">
      <ItFactsGame />
    </div>
  </section>
</template>

<script setup lang="ts">
useSeo({
  title: itFactsApplication.name,
  description: itFactsApplication.description,
  favicon: {
    type: "image/svg",
    href: "/svg/it-facts/logo.svg",
  },
});
</script>
