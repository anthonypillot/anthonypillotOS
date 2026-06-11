<template>
  <header class="absolute inset-x-0 top-0 z-50 lg:fixed lg:backdrop-blur-md">
    <nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div class="flex lg:flex-1">
        <NuxtLink to="/" class="-m-1.5 p-1.5">
          <span class="sr-only">{{ config.public.title }}</span>
          <NuxtImg quality="80" class="h-12 w-auto" :src="logo" :alt="config.public.title" style="filter: invert(1)" />
        </NuxtLink>
      </div>
      <div class="flex lg:hidden">
        <UButton icon="i-heroicons-bars-3" variant="ghost" size="sm" aria-label="Open main menu" @click="mobileMenuOpen = true" />
      </div>
      <div class="hidden lg:flex lg:gap-x-12 lg:items-center">
        <a
          v-for="item in navigation"
          :key="item.name"
          :href="item.href"
          :rel="item.rel"
          :target="item.target"
          class="text-sm font-semibold leading-6 text-white hover:bg-white hover:text-black rounded-md px-2 py-1"
          >{{ item.name }}</a
        >
        <UPopover :content="{ align: 'center', side: 'bottom', sideOffset: 8 }">
          <UButton
            id="popover-button-tools"
            label="Tools"
            variant="ghost"
            trailing-icon="i-heroicons-chevron-down"
            class="text-sm font-semibold text-white"
          />

          <template #content="{ close }">
            <div
              class="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5"
            >
              <div class="p-4">
                <div v-for="item in popover.links" :key="item.name" class="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                  <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <UIcon :name="item.icon" class="h-6 w-6 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
                  </div>
                  <div>
                    <NuxtLink :to="item.to" class="font-semibold text-gray-900" @click="close()">
                      {{ item.name }}
                      <span class="absolute inset-0" />
                    </NuxtLink>
                    <p class="mt-1 text-gray-600">{{ item.description }}</p>
                  </div>
                </div>
              </div>
              <div class="grid divide-x divide-gray-900/5 bg-gray-50">
                <NuxtLink
                  v-for="item in popover.callsToAction"
                  :key="item.name"
                  :to="item.to"
                  class="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100"
                  @click="close()"
                >
                  <UIcon :name="item.icon" class="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                  {{ item.name }}
                </NuxtLink>
              </div>
            </div>
          </template>
        </UPopover>
      </div>
      <div class="hidden lg:flex lg:flex-1 lg:justify-end">
        <a :href="config.public.link.githubRepository" rel="noopener" target="_blank" class="text-sm font-semibold leading-6 text-white"
          >GitHub repository <span aria-hidden="true">&rarr;</span></a
        >
      </div>
    </nav>
    <UDrawer v-model:open="mobileMenuOpen" direction="right" :handle="false" :close="false" :ui="{ content: 'w-full sm:max-w-lg' }">
      <template #header>
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/"
            class="-m-1.5 p-1.5"
            @click="
              {
                mobileMenuOpen = false;
              }
            "
          >
            <span class="sr-only">{{ config.public.title }}</span>
            <NuxtImg quality="80" class="h-12 w-auto" :src="logo" :alt="config.public.title" />
          </NuxtLink>
          <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" aria-label="Close menu" @click="mobileMenuOpen = false" />
        </div>
      </template>
      <template #body>
        <div class="flow-root">
          <div class="-my-6 divide-y divide-default">
            <div class="space-y-2 py-6">
              <a
                v-for="item in navigation"
                :key="item.name"
                :href="item.href"
                :rel="item.rel"
                :target="item.target"
                class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-default hover:bg-muted"
                >{{ item.name }}</a
              >
              <UPopover :content="{ align: 'center', side: 'bottom', sideOffset: 8 }">
                <UButton
                  id="popover-button-tools-mobile"
                  label="Tools"
                  variant="ghost"
                  trailing-icon="i-heroicons-chevron-down"
                  class="-mx-3 text-base font-semibold text-default hover:bg-muted"
                />

                <template #content="{ close }">
                  <div
                    class="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5"
                  >
                    <div class="p-4">
                      <div
                        v-for="item in popover.links"
                        :key="item.name"
                        class="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div
                          class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white"
                        >
                          <UIcon :name="item.icon" class="h-6 w-6 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
                        </div>
                        <div>
                          <NuxtLink
                            :to="item.to"
                            class="font-semibold text-gray-900"
                            @click="
                              {
                                close();
                                mobileMenuOpen = false;
                              }
                            "
                          >
                            {{ item.name }}
                            <span class="absolute inset-0" />
                          </NuxtLink>
                          <p class="mt-1 text-gray-600">{{ item.description }}</p>
                        </div>
                      </div>
                    </div>
                    <div class="grid divide-x divide-gray-900/5 bg-gray-50">
                      <NuxtLink
                        v-for="item in popover.callsToAction"
                        :key="item.name"
                        :to="item.to"
                        class="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100"
                        @click="
                          {
                            close();
                            mobileMenuOpen = false;
                          }
                        "
                      >
                        <UIcon :name="item.icon" class="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                        {{ item.name }}
                      </NuxtLink>
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>
            <div class="py-6">
              <a
                :href="config.public.link.githubRepository"
                rel="noopener"
                target="_blank"
                class="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-default hover:bg-muted"
                >GitHub repository &rarr;</a
              >
            </div>
          </div>
        </div>
      </template>
    </UDrawer>
  </header>
</template>

<script setup lang="ts">
const mobileMenuOpen: Ref<boolean> = ref(false);

const config = useRuntimeConfig();

const logo = config.public.logo.os.raw;

const navigation = [
  { name: "My LinkedIn", href: config.public.link.linkedIn, rel: "noopener", target: "_blank" },
  { name: "My GitHub", href: config.public.link.githubAccount, rel: "noopener", target: "_blank" },
];

const popover = {
  links: [
    {
      name: taskHoldemApplication.name,
      description: "Poker planning tool for agile teams",
      to: "/tools/task-holdem",
      icon: "i-heroicons-squares-plus",
    },
    {
      name: "GitHub History Cleaner",
      description: "Delete all your GitHub project history",
      to: "/tools/github/history-cleaner",
      icon: "i-heroicons-arrow-path-rounded-square",
    },
  ],
  callsToAction: [
    {
      name: "View all tools",
      to: "/tools",
      icon: "i-heroicons-squares-plus",
    },
  ],
};
</script>
