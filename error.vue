<template>
  <div>
    <!-- Header -->
    <BaseHeader />

    <!-- Error content -->
    <div class="md:pt-64">
      <div class="relative bg-gray-900">
        <div class="relative h-80 overflow-hidden bg-indigo-600 md:absolute md:left-0 md:h-full md:w-1/3 lg:w-1/2">
          <NuxtImg class="h-full w-full object-cover error-image" src="/img/404.jpeg" alt="random illustration" />
        </div>
        <div class="relative mx-auto max-w-7xl py-24 sm:py-32 lg:px-8 lg:py-40">
          <div class="pl-6 pr-6 md:ml-auto md:w-2/3 md:pl-16 lg:w-1/2 lg:pl-24 lg:pr-0 xl:pl-32">
            <h1 class="text-base font-semibold leading-7 text-indigo-400">{{ "Error " + props.error?.statusCode || "Error" }}</h1>
            <p class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {{ props.error?.message || "An error occurred" }}
            </p>
            <p class="mt-6 text-base leading-7 text-gray-300">
              Something went wrong. Please try again later.<br />Or maybe you're lost? No worries, we'll help you find your way. Just click
              the button below to go back to the home page.
            </p>
            <div class="mt-8">
              <NuxtLink
                to="/"
                class="inline-flex rounded-md bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >Back to home page
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <BaseFooter />
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps({
  error: Object as () => NuxtError,
});

const config = useRuntimeConfig();
const title = `${props.error?.statusCode ? "Error " + props.error?.statusCode : "Error"} | ${config.app.website.title}`;

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
  meta: [
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
});
</script>

<style scoped>
.error-image {
  filter: hue-rotate(200deg);
}
</style>
