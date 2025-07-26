<template>
  <section class="relative isolate overflow-hidden bg-gray-900 pb-16 pt-14 sm:pb-20">
    <EffectAurora
      :color-stops="['#818bf7', '#171D22', '#5a62b5']"
      :amplitude="1.0"
      :blend="0.5"
      :speed="1.0"
      :intensity="1.0"
      class="w-full h-full"
    />
    <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
      <div
        class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        style="
          clip-path: polygon(
            74.1% 44.1%,
            100% 61.6%,
            97.5% 26.9%,
            85.5% 0.1%,
            80.7% 2%,
            72.5% 32.5%,
            60.2% 62.4%,
            52.4% 68.1%,
            47.5% 58.3%,
            45.2% 34.5%,
            27.5% 76.7%,
            0.1% 64.9%,
            17.9% 100%,
            27.6% 76.8%,
            76.1% 97.7%,
            74.1% 44.1%
          );
        "
      />
    </div>
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-2xl py-12 lg:py-20">
        <div class="hidden sm:mb-8 sm:flex sm:justify-center">
          <div class="relative rounded-lg px-3 py-1 text-sm leading-6 bg-white/5 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
            Discover my new <span class="font-semibold text-white">poker planning tool</span>: the
            <span class="font-semibold text-white">{{ taskHoldemApplication.name }}</span> !
            <NuxtLink to="/tools/task-holdem" class="font-semibold text-white"
              ><span class="absolute inset-0" aria-hidden="true" />This is here <span aria-hidden="true">&rarr;</span></NuxtLink
            >
          </div>
        </div>
        <div class="flex flex-col text-center">
          <NuxtImg quality="80" class="h-80" :src="logo" :alt="config.public.title" />
          <div class="hidden sm:flex sm:flex-col items-center my-8">
            <div>
              <span class="text-white text-4xl mr-2">OS</span>
              <span class="text-indigo-400 text-4xl mr-2">stands for</span>
              <span class="text-white text-4xl mr-2">:</span>
              <div class="h-8">
                <ClientOnly>
                  <VueWriter class="text-white text-4xl" :array="writers" :typeSpeed="80" :eraseSpeed="40" :start="1000" />
                </ClientOnly>
              </div>
            </div>
          </div>
          <h1 class="hidden text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {{ config.public.title }} | {{ config.public.description }}
          </h1>
          <p class="mt-2 text-lg leading-8 text-gray-300">
            <span class="text-indigo-400">Freelance</span> Software Engineer, <span class="text-indigo-400">Real</span> Full Stack
            Developer, and <span class="text-indigo-400">more</span>.
          </p>
          <p class="mt-2 text-lg leading-8 text-gray-300">
            <span class="text-indigo-400">Lille</span>, France. <span class="text-indigo-400">Remote</span> and
            <span class="text-indigo-400">on-site</span> work.
          </p>
          <!-- <div class="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="#"
                  class="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  >Get started</a
                >
                <a href="#" class="text-sm font-semibold leading-6 text-white">Live demo <span aria-hidden="true">→</span></a>
              </div> -->
        </div>
      </div>
    </div>
    <div class="xl:flex xl:justify-center">
      <div
        class="grid grid-cols-2 justify-center sm:flex sm:flex-row sm:justify-between mx-4 gap-4 xl:gap-32 md:mx-24 p-2 sm:bg-white/10 sm:border border-white/30 backdrop-blur-sm rounded-lg sm:rounded-full"
      >
        <div
          v-for="(logo, index) in logos"
          :key="index"
          :class="[
            'flex flex-row text-center items-center justify-center min-w-14 p-2 bg-white/15 border border-white/15 rounded-full hover:scale-90 transition-transform',
            isLastItem(index) && logos.length % 2 !== 0 ? 'col-span-2' : '',
          ]"
        >
          <NuxtLink :to="logo.link" target="_blank">
            <NuxtImg :key="index" class="h-10 w-full object-contain" style="padding: 0.1rem" :src="logo.src" :alt="logo.alt" />
          </NuxtLink>
        </div>
      </div>
    </div>
    <div
      class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      aria-hidden="true"
    >
      <div
        class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        style="
          clip-path: polygon(
            74.1% 44.1%,
            100% 61.6%,
            97.5% 26.9%,
            85.5% 0.1%,
            80.7% 2%,
            72.5% 32.5%,
            60.2% 62.4%,
            52.4% 68.1%,
            47.5% 58.3%,
            45.2% 34.5%,
            27.5% 76.7%,
            0.1% 64.9%,
            17.9% 100%,
            27.6% 76.8%,
            76.1% 97.7%,
            74.1% 44.1%
          );
        "
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-expect-error
import { VueWriter } from "vue-writer";

const writers = ["Operating System", "Open Source", "Object Storage", "Organic Search", "Omniscient System", "Oh my god, So good"];

const config = useRuntimeConfig();

const logo = config.public.logo.hero.white;

const logos = [
  {
    src: "svg/icons/vue.svg",
    alt: "Vue.js",
    link: "https://vuejs.org",
  },
  {
    src: "svg/icons/nuxt.svg",
    alt: "Nuxt",
    link: "https://nuxt.com",
  },
  {
    src: "svg/icons/typescript.svg",
    alt: "TypeScript",
    link: "https://www.typescriptlang.org",
  },
  {
    src: "svg/icons/node.svg",
    alt: "Node.js",
    link: "https://nodejs.org",
  },
  {
    src: "svg/icons/kubernetes.svg",
    alt: "Kubernetes",
    link: "https://kubernetes.io",
  },
  {
    src: "svg/icons/signoz.svg",
    alt: "SigNoz",
    link: "https://signoz.io",
  },
  {
    src: "svg/icons/matomo.svg",
    alt: "Matomo",
    link: "https://matomo.org",
  },
];

/**
 * Check if the current item is the last one in the list
 */
function isLastItem(index: number): boolean {
  return index === logos.length - 1;
}
</script>

<style scoped>
.gradient-background {
  background: linear-gradient(300deg, var(--secondary-color), var(--primary-color), var(--secondary-color));
  background-size: 180% 180%;
  animation: gradient-animation 10s ease infinite;
}

@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
