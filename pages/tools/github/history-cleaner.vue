<template>
  <!-- GitHub History Cleaner hero section -->
  <GithubHistoryCleanerIntroduction />

  <!-- GitHub History Cleaner application section -->
  <GithubHistoryCleaner />
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const title = `GitHub History Cleaner | ${config.app.website.title}`;
const description = "GitHub History Cleaner is a free and open-source tool to clean your GitHub history.";

useSeoMeta({
  title: title,
  ogTitle: title,
  description: description,
  ogDescription: description,
});
</script>
