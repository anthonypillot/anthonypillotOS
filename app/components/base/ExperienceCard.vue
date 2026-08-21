<template>
  <article class="text-white">
    <BaseBorderGlow animated>
      <div class="p-4 sm:p-6 lg:p-8">
        <p class="mb-3 flex flex-wrap items-center gap-x-2 text-[0.625rem] font-medium uppercase tracking-wider text-indigo-300 sm:hidden">
          <span>{{ experience.period.from }}</span>
          <span aria-hidden="true">/</span>
          <span :class="experience.period.to === 'Now' ? 'text-emerald-300' : 'text-gray-400'">{{ experience.period.to }}</span>
        </p>

        <div class="flex items-center gap-3 sm:gap-5">
          <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2 shadow-inner sm:size-16 sm:p-3">
            <NuxtImg :src="experience.company.logo.url" :alt="experience.company.logo.alt" class="size-full object-contain" />
          </div>

          <div class="min-w-0 flex-1">
            <h2 class="truncate text-lg font-medium tracking-wide sm:text-2xl">{{ experience.company.name }}</h2>
            <p class="mt-0.5 text-xs font-medium text-indigo-300 sm:mt-1 sm:text-base">{{ experience.role }}</p>
          </div>

          <a
            :href="experience.company.website"
            target="_blank"
            rel="noopener noreferrer"
            class="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-indigo-300 transition-colors hover:border-indigo-300/60 hover:bg-indigo-400/10 hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 sm:size-12"
            :aria-label="`Visit ${experience.company.name} website`"
          >
            <UIcon name="i-heroicons-arrow-up-right" class="size-5 sm:size-6" aria-hidden="true" />
          </a>
        </div>

        <div class="my-4 h-px bg-white/10 sm:my-6" />

        <p class="text-sm leading-6 text-gray-200 sm:text-base sm:leading-7">{{ experience.description }}</p>

        <ul class="mt-4 divide-y divide-white/10 sm:mt-6">
          <li
            v-for="highlight in experience.highlights"
            :key="highlight.label"
            class="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4 sm:py-4"
          >
            <span class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-800/70 sm:size-11">
              <UIcon :name="highlight.icon" class="size-5 text-indigo-300 sm:size-6" aria-hidden="true" />
            </span>
            <span class="text-sm leading-5 text-gray-100 sm:text-base">{{ highlight.label }}</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        class="group flex w-full items-center gap-3 border-t border-white/10 bg-slate-800/45 px-4 py-4 text-left text-sm font-medium text-emerald-300 transition-colors hover:bg-slate-800/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-400 sm:px-6 sm:py-5 sm:text-base lg:px-8"
        :aria-label="`View ${technologyLabel} used at ${experience.company.name}`"
        @click="openDrawer"
      >
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-slate-900/50">
          <UIcon name="i-heroicons-circle-stack" class="size-5" aria-hidden="true" />
        </span>
        <span>{{ technologyLabel }}</span>
        <UIcon name="i-heroicons-arrow-right" class="ml-auto size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </button>
    </BaseBorderGlow>
  </article>

  <UDrawer
    v-model:open="isDrawerOpen"
    :title="experience.company.name"
    description="Technologies and tools used in this role"
    class="bg-gray-900 sm:max-w-[75dvw]"
    direction="right"
    :fixed="false"
    :should-scale-background="true"
    :set-background-color-on-scale="true"
  >
    <template #content>
      <div class="flex flex-col gap-4 m-8 overflow-y-auto">
        <div class="flex justify-between">
          <h2 class="text-xl text-white">{{ experience.company.name }}</h2>
          <UButton
            icon="i-heroicons-x-circle"
            variant="ghost"
            size="sm"
            class="text-white"
            :aria-label="`Close ${experience.company.name} technologies`"
            @click="isDrawerOpen = false"
          />
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
              <h3 class="text-sm font-semibold text-indigo-400 mb-2">Front-end</h3>
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

          <div v-if="experience.technology.architecture" class="mt-2 bg-gray-800/60 p-3 rounded-lg">
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
const isDrawerOpen = ref<boolean>(false);

type ExperienceHighlight = {
  label: string;
  icon: `i-heroicons-${string}`;
};

function openDrawer() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  isDrawerOpen.value = true;
}

export type Experience = {
  company: {
    name: string;
    website: string;
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
  highlights: readonly [ExperienceHighlight, ExperienceHighlight, ExperienceHighlight];
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

const props = defineProps<{
  experience: Experience;
}>();

const technologyCount = computed(() =>
  Object.values(props.experience.technology).reduce((count, technologies) => count + technologies.length, 0),
);
const technologyLabel = computed(() => `${technologyCount.value} technologies and tools`);
</script>
