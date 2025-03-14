<template>
  <div class="bg-gray-900 py-24 sm:py-32">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20"
        >
          <img
            class="h-96 w-full flex-none rounded-2xl object-cover shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm"
            src="https://images.unsplash.com/photo-1654277041218-84424c78f0ae?q=80&w=800"
            alt="github history cleaner"
          />
          <div class="w-full flex-auto">
            <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">GitHub History Cleaner</h1>
            <div class="mt-6 text-lg leading-8 text-gray-300">
              <p class="mt-6 text-lg leading-8 text-gray-300">A one click solution to clean up your GitHub project history.</p>
              <span class="text-indigo-400">GitHub History Cleaner</span> is a tool that allows you to clean up your GitHub history. As
              executed workflows, deployments, releases, packages, and other artifacts accumulate.
            </div>
            <ul role="list" class="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base leading-7 text-white sm:grid-cols-2">
              <li v-for="benefit in benefits" :key="benefit" class="flex gap-x-3">
                <CheckCircleIcon class="h-7 w-5 flex-none" aria-hidden="true" />
                {{ benefit }}
              </li>
            </ul>
            <div class="mt-10 flex">
              <button @click="scrollToTool()" class="text-sm font-semibold leading-6 text-indigo-400">
                Go to the GitHub History Cleaner tool
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon } from "@heroicons/vue/20/solid";

const benefits = [
  "Reducing the risk of exposing sensitive data or secrets by purging workflow runs that may contain them.",
  "Freeing up storage space on your repository by deleting old or unnecessary workflow artifacts and logs.",
  "Simplify or organize your GitHub user interface by removing old or unnecessary workflow runs, deployments, etc.",
  "Freeing up old deployment history that is no longer needed.",
];

function scrollToTool(): void {
  const element = document.getElementById("github-history-cleaner");
  const offset = 150;
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
}
</script>
