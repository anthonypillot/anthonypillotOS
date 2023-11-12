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

    <!-- Vercel SpeedInsights used for performance metrics ; see: https://vercel.com/docs/speed-insights -->
    <SpeedInsights />
  </div>
</template>

<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/vue";

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
