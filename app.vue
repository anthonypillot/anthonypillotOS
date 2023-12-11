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
import { author, description } from "@/package.json";

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
