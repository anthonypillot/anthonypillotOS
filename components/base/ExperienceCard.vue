<template>
  <section class="mx-auto sm:max-w-screen-xl text-white bg-white/5 p-8 md:rounded-lg">
    <div class="flex flex-col gap-4 experience-card">
      <div class="flex flex-col justify-center h-full bg-gray-50 rounded-2xl">
        <NuxtImg :src="experience.company.logo.url" :alt="experience.company.logo.alt" class="p-4 object-contain" />
      </div>
      <div class="flex flex-col gap-4">
        <p class="text-xs text-gray-300">{{ experience.period.from }} > {{ experience.period.to }}</p>
        <div class="flex items-center gap-4">
          <h2 class="text-2xl">{{ experience.company.name }}</h2>
          <p class="text-xs text-gray-600 bg-gray-100 py-1 px-2 rounded-lg">{{ experience.role }}</p>
        </div>
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-2 text-sm text-justify">
            <div v-html="experience.description" class="bg-gray-800/40 p-4 rounded-lg border-l-4 border-indigo-400" />
          </div>
          <UButton
            label="Technologies and tools used"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-chevron-right"
            @click="isDrawerOpen = true"
          />
        </div>
      </div>
    </div>
  </section>

  <UDrawer
    v-model:open="isDrawerOpen"
    class="bg-gray-900 sm:max-w-[75dvw]"
    direction="right"
    :fixed="false"
    should-scale-background
    set-background-color-on-scale
  >
    <template #content>
      <div class="flex flex-col gap-4 m-8">
        <div class="flex justify-between">
          <h2 class="text-xl text-white">{{ experience.company.name }}</h2>
          <button class="text-white" @click="isDrawerOpen = false">
            <XCircleIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="flex flex-col gap-6 text-white">
          <p class="text-sm text-gray-300 font-medium">Technologies and tools used:</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="experience.technology.language" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-blue-400 mb-2">Languages</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="language in experience.technology.language" :key="language" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  language
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.backend" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-green-400 mb-2">Back-end</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="backend in experience.technology.backend" :key="backend" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  backend
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.frontend" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-purple-400 mb-2">Front-end</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="frontend in experience.technology.frontend" :key="frontend" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  frontend
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.testing" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-yellow-400 mb-2">Testing</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="testing in experience.technology.testing" :key="testing" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  testing
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.data" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-teal-400 mb-2">Data</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="data in experience.technology.data" :key="data" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  data
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.devops" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-orange-400 mb-2">DevOps</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="devops in experience.technology.devops" :key="devops" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  devops
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.cicd" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-indigo-400 mb-2">CI/CD</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="cicd in experience.technology.cicd" :key="cicd" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  cicd
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.security" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-red-400 mb-2">Security</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="security in experience.technology.security" :key="security" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  security
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.cloud" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-cyan-400 mb-2">Cloud & Serverless</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="cloud in experience.technology.cloud" :key="cloud" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{
                  cloud
                }}</span>
              </p>
            </div>

            <div v-if="experience.technology.analytics" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-amber-400 mb-2">Analytics</h3>
              <p class="flex flex-wrap gap-2">
                <span
                  v-for="analytic in experience.technology.analytics"
                  :key="analytic"
                  class="bg-gray-700 text-xs px-2 py-1 rounded-md"
                  >{{ analytic }}</span
                >
              </p>
            </div>

            <div v-if="experience.technology.ide" class="bg-gray-800/60 p-3 rounded-lg">
              <h3 class="text-sm font-semibold text-pink-400 mb-2">IDE</h3>
              <p class="flex flex-wrap gap-2">
                <span v-for="ide in experience.technology.ide" :key="ide" class="bg-gray-700 text-xs px-2 py-1 rounded-md">{{ ide }}</span>
              </p>
            </div>
          </div>

          <div v-if="experience.technology" class="mt-2 bg-gray-800/60 p-3 rounded-lg">
            <h3 class="text-sm font-semibold text-emerald-400 mb-2">Architecture</h3>
            <p class="flex flex-wrap gap-2">
              <span
                v-for="architecture in experience.technology.architecture"
                :key="architecture"
                class="bg-gray-700 text-xs px-2 py-1 rounded-md"
                >{{ architecture }}</span
              >
            </p>
          </div>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { XCircleIcon } from "@heroicons/vue/24/outline";

const isDrawerOpen = ref<boolean>(false);

export type Experience = {
  company: {
    name: string;
    logo: {
      url: string;
      alt: string;
    };
  };
  period: {
    from: string;
    to: string;
  };
  role: string;
  description: string;
  technology: {
    language?: string[];
    backend?: string[];
    frontend?: string[];
    testing?: string[];
    data?: string[];
    devops?: string[];
    cicd?: string[];
    security?: string[];
    cloud?: string[];
    analytics?: string[];
    ide?: string[];
    architecture?: string[];
  };
};

defineProps<{
  experience: Experience;
}>();
</script>

<style scoped>
.experience-card {
  @media screen and (min-width: 640px) {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 2rem;
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(100px);
  opacity: 0;
}
</style>
