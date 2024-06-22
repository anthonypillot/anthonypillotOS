<template>
  <section class="bg-gray-900 py-24 sm:py-32">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20"
        >
          <NuxtImg
            class="h-96 w-full flex-none rounded-2xl object-cover shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm"
            src="/svg/task-holdem/poker-hand.svg"
            :alt="application.name"
          />
          <div class="flex flex-col gap-y-8">
            <div class="w-full flex-auto">
              <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">{{ application.name }}</h1>
              <span
                class="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30"
                >Beta</span
              >
              <h2 class="mt-6 text-lg leading-8 text-gray-300">{{ application.description }}</h2>
            </div>
            <a
              class="text-white border border-white rounded-md px-4 py-2 text-center hover:bg-white hover:text-black"
              href="/tools/task-holdem/application"
              >Launch {{ application.name }}</a
            >
          </div>
        </div>
      </div>
      <div class="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl" aria-hidden="true">
        <div
          class="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25"
          style="
            clip-path: polygon(
              73.6% 51.7%,
              91.7% 11.8%,
              100% 46.4%,
              97.4% 82.2%,
              92.5% 84.9%,
              75.7% 64%,
              55.3% 47.5%,
              46.5% 49.4%,
              45% 62.9%,
              50.3% 87.2%,
              21.3% 64.1%,
              0.1% 100%,
              5.4% 51.1%,
              21.4% 63.9%,
              58.9% 0.2%,
              73.6% 51.7%
            );
          "
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { application } from "@/types/task-holdem.type";

const config = useRuntimeConfig();

const title = `${application.name} | ${config.app.website.title}`;
const description = application.description;

useSeo({
  title,
  description,
  favicon: {
    type: "image/svg",
    href: "/svg/task-holdem/poker-hand.svg",
  },
});
</script>
