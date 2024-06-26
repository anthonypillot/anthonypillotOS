<template>
  <section class="mt-32 flex flex-col gap-y-12 mx-auto w-10/12">
    <TaskHoldemChat />
    <SocketTechnicalData />
  </section>
</template>

<script setup lang="ts">
import { application } from "@/types/task-holdem.type";

const config = useRuntimeConfig();

const title = `${application.name} | ${config.app.website.title}`;
const description = application.description;

useSeoMeta({
  title: title,
  ogTitle: title,
  description: description,
  ogDescription: description,
});
</script>
