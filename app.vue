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
import { author, description } from "@/package.json";
import { SpeedInsights } from "@vercel/speed-insights/vue";

const title = "anthonypillotOS";
const img = "https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_white.svg";

useSeoMeta({
  title: title + " | Personal application by Anthony Pillot",
  ogTitle: title,
  description: description,
  ogDescription: description,
  ogImage: img,
  ogUrl: author.url,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: img,
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
