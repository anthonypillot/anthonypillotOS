<template>
  <div class="relative isolate overflow-hidden bg-gray-900 pb-16 pt-14 sm:pb-20">
    <NuxtImg
      format="webp"
      quality="80"
      src="https://focus.courrierinternational.com/2022/02/04/0/0/3882/2584/1280/0/60/0/89816dd_1644014034247-christopher-gower-m-hrflhgabo-unsplash.jpg"
      alt=""
      class="absolute inset-0 -z-10 h-full w-full object-cover"
      style="filter: blur(4px) hue-rotate(60deg) brightness(25%)"
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
      <div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-32">
        <div class="hidden sm:mb-8 sm:flex sm:justify-center">
          <div class="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
            Discover our <span class="font-semibold text-white">Size Up</span> org.
            <span class="font-semibold text-white">documentation</span> website.
            <NuxtLink :href="config.app.website.link.sizeUpDocumentation" target="_blank" class="font-semibold text-white"
              ><span class="absolute inset-0" aria-hidden="true" />Get me in <span aria-hidden="true">&rarr;</span></NuxtLink
            >
          </div>
        </div>
        <div class="flex flex-col text-center">
          <NuxtImg format="webp" quality="80" class="h-80" :src="logo" :alt="config.app.website.title" />
          <h1 class="hidden text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {{ config.app.website.title }} | {{ config.app.website.description }}
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-300">
            <span class="text-indigo-400">Freelance</span> Software Engineer, <span class="text-indigo-400">Real</span> Full Stack
            Developer, and <span class="text-indigo-400">more</span>.
          </p>
          <p class="mt-6 text-lg leading-8 text-gray-300">
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

      <!-- Logo cloud -->
      <div
        class="mx-auto grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5"
      >
        <NuxtImg
          format="webp"
          quality="80"
          class="col-span-2 max-h-12 w-full object-contain sm:col-start-2 lg:col-span-1"
          src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg"
          alt="TypeScript"
          width="158"
          height="48"
          style="filter: hue-rotate(30deg)"
        />
        <NuxtImg
          format="webp"
          quality="80"
          class="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
          src="https://upload.wikimedia.org/wikipedia/commons/9/95/Vue.js_Logo_2.svg"
          alt="Vue.js"
          width="158"
          height="48"
          style="filter: hue-rotate(110deg)"
        />
        <NuxtImg
          format="webp"
          quality="80"
          class="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
          src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Nuxt_logo.svg"
          alt="Nuxt"
          width="158"
          height="48"
          style="filter: hue-rotate(110deg)"
        />
        <NuxtImg
          format="webp"
          quality="80"
          class="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
          src="https://static-00.iconduck.com/assets.00/node-js-icon-454x512-nztofx17.png"
          alt="Node.js"
          width="158"
          height="48"
          style="filter: hue-rotate(145deg)"
        />
        <NuxtImg
          format="webp"
          quality="80"
          class="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1"
          src="https://www.vectorlogo.zone/logos/java/java-icon.svg"
          alt="Java"
          width="158"
          height="48"
          style="filter: hue-rotate(220deg)"
        />
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
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const logo = config.app.website.logo.white;
</script>
