<template>
  <div>
    <!-- Header -->
    <BaseHeader />

    <!-- Main content -->
    <main>
      <NuxtPage />
    </main>

    <!-- Footer -->
    <BaseFooter />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const title = `The Operating System by ${config.app.website.author.name} | ${config.app.website.title}`;

useSeoMeta({
  title: title,
  ogTitle: title,
  description: config.app.website.description,
  ogDescription: config.app.website.description,
  ogImage: config.app.website.logo.os.raw,
  ogUrl: config.app.website.url,
  twitterTitle: config.app.website.title,
  twitterDescription: config.app.website.description,
  twitterImage: config.app.website.logo.os.raw,
  twitterCard: "summary",
});

useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico",
    },
  ],
});
</script>
