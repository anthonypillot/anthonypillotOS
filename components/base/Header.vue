<template>
  <header class="absolute inset-x-0 top-0 z-50">
    <nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div class="flex lg:flex-1">
        <NuxtLink to="/" class="-m-1.5 p-1.5">
          <span class="sr-only">{{ config.app.website.title }}</span>
          <NuxtImg quality="80" class="h-12 w-auto" :src="logo" :alt="config.app.website.title" style="filter: invert(1)" />
        </NuxtLink>
      </div>
      <div class="flex lg:hidden">
        <button
          type="button"
          class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
          @click="mobileMenuOpen = true"
        >
          <span class="sr-only">Open main menu</span>
          <Bars3Icon class="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <div class="hidden lg:flex lg:gap-x-12">
        <a
          v-for="item in navigation"
          :key="item.name"
          :href="item.href"
          :rel="item.rel"
          :target="item.target"
          class="text-sm font-semibold leading-6 text-white"
          >{{ item.name }}</a
        >
        <Popover class="relative">
          <PopoverButton id="popover-button-tools" class="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-white">
            <span>Tools</span>
            <ChevronDownIcon class="h-5 w-5" aria-hidden="true" />
          </PopoverButton>

          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <PopoverPanel v-slot="{ close }" class="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 px-4">
              <div
                class="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5"
              >
                <div class="p-4">
                  <div v-for="item in popover.links" :key="item.name" class="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                    <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <component :is="item.icon" class="h-6 w-6 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
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
                  <a
                    v-for="item in popover.callsToAction"
                    :key="item.name"
                    :href="item.href"
                    :target="item.target"
                    class="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100"
                  >
                    <component :is="item.icon" class="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                    {{ item.name }}
                  </a>
                </div>
              </div>
            </PopoverPanel>
          </transition>
        </Popover>
      </div>
      <div class="hidden lg:flex lg:flex-1 lg:justify-end">
        <a
          :href="config.app.website.link.githubRepository"
          rel="noopener"
          target="_blank"
          class="text-sm font-semibold leading-6 text-white"
          >GitHub repository <span aria-hidden="true">&rarr;</span></a
        >
      </div>
    </nav>
    <ClientOnly>
      <Dialog as="div" class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
        <div class="fixed inset-0 z-50" />
        <DialogPanel
          class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-lg sm:ring-1 sm:ring-gray-900/10"
        >
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
              <span class="sr-only">{{ config.app.website.title }}</span>
              <NuxtImg quality="80" class="h-12 w-auto" :src="logo" :alt="config.app.website.title" />
            </NuxtLink>
            <button type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700" @click="mobileMenuOpen = false">
              <span class="sr-only">Close menu</span>
              <XMarkIcon class="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mt-6 flow-root">
            <div class="-my-6 divide-y divide-gray-500/10">
              <div class="space-y-2 py-6">
                <a
                  v-for="item in navigation"
                  :key="item.name"
                  :href="item.href"
                  :rel="item.rel"
                  :target="item.target"
                  class="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >{{ item.name }}</a
                >
                <Popover class="relative">
                  <PopoverButton
                    id="popover-button-tools-mobile"
                    class="inline-flex items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    <span class="text-black">Tools</span>
                    <ChevronDownIcon class="h-5 w-5 text-black" aria-hidden="true" />
                  </PopoverButton>

                  <transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 translate-y-1"
                  >
                    <PopoverPanel v-slot="{ close }" class="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 px-4">
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
                              <component :is="item.icon" class="h-6 w-6 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
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
                          <a
                            v-for="item in popover.callsToAction"
                            :key="item.name"
                            :href="item.href"
                            :target="item.target"
                            class="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100"
                          >
                            <component :is="item.icon" class="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                            {{ item.name }}
                          </a>
                        </div>
                      </div>
                    </PopoverPanel>
                  </transition>
                </Popover>
              </div>
              <div class="py-6">
                <a
                  :href="config.app.website.link.githubRepository"
                  rel="noopener"
                  target="_blank"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >GitHub repository &rarr;</a
                >
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </ClientOnly>
  </header>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel } from "@headlessui/vue";
import { Bars3Icon, XMarkIcon, SquaresPlusIcon } from "@heroicons/vue/24/outline";

const mobileMenuOpen: Ref<boolean> = ref(false);

const config = useRuntimeConfig();

const logo = config.app.website.logo.os.raw;

const navigation = [
  { name: "My LinkedIn", href: config.app.website.link.linkedIn, rel: "noopener", target: "_blank" },
  { name: "My GitHub", href: config.app.website.link.githubAccount, rel: "noopener", target: "_blank" },
  { name: "Size Up - Org.", href: config.app.website.link.githubOrganization, rel: "noopener", target: "_blank" },
  // { name: "Size Up - Documentation", href: config.app.website.link.sizeUpDocumentation, rel: "", target: "_blank" },
];

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
import { ChevronDownIcon, DocumentIcon } from "@heroicons/vue/20/solid";
import { ArrowPathRoundedSquareIcon } from "@heroicons/vue/24/outline";

const popover = {
  links: [
    {
      name: "TaskHold’em",
      description: "Poker planning tool for agile teams",
      to: "/tools/task-holdem",
      icon: SquaresPlusIcon,
    },
    {
      name: "GitHub History Cleaner",
      description: "Delete all your GitHub project history",
      to: "/tools/github/history-cleaner",
      icon: ArrowPathRoundedSquareIcon,
    },
  ],
  callsToAction: [
    {
      name: "Size Up docs. about GitHub actions",
      href: config.app.website.link.sizeUpDocumentation + "/docs/category/actions",
      target: "_blank",
      icon: DocumentIcon,
    },
  ],
};
</script>
