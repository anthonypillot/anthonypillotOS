<template>
  <header class="absolute inset-x-0 top-0 z-50">
    <nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div class="flex lg:flex-1">
        <a href="#" class="-m-1.5 p-1.5">
          <span class="sr-only">anthonypillotOS</span>
          <NuxtImg
            format="webp"
            quality="80"
            class="h-12 w-auto"
            src="https://raw.githubusercontent.com/anthonypillot/assets/78c3327a009fa95b72dd06dac4bbc3e811f5a1c3/logo/svg/logo_anthonypillotOS_OS.svg"
            alt="anthonypillotOS"
            style="filter: invert(1)"
          />
        </a>
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
      </div>
      <div class="hidden lg:flex lg:flex-1 lg:justify-end">
        <NuxtLink :href="data.url.githubRepository" rel="noopener" target="_blank" class="text-sm font-semibold leading-6 text-white"
          >GitHub repository <span aria-hidden="true">&rarr;</span></NuxtLink
        >
      </div>
    </nav>
    <Dialog as="div" class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
      <div class="fixed inset-0 z-50" />
      <DialogPanel class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
        <div class="flex items-center justify-between">
          <a href="#" class="-m-1.5 p-1.5">
            <span class="sr-only">anthonypillotOS</span>
            <NuxtImg
              format="webp"
              quality="80"
              class="h-12 w-auto"
              src="https://raw.githubusercontent.com/anthonypillot/assets/78c3327a009fa95b72dd06dac4bbc3e811f5a1c3/logo/svg/logo_anthonypillotOS_OS.svg"
              alt=""
            />
          </a>
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
            </div>
            <div class="py-6">
              <a
                :href="data.url.githubRepository"
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
  </header>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel } from "@headlessui/vue";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  data: {
    email: {
      owner: string;
    };
    url: {
      linkedIn: string;
      githubAccount: string;
      githubRepository: string;
      githubOrganization: string;
      githubFreeGamesCatcherCore: string;
      sizeUpDocumentation: string;
    };
  };
}>();

const navigation = [
  { name: "Home", href: "/", rel: "", target: "" },
  { name: "My LinkedIn", href: props.data.url.linkedIn, rel: "noopener", target: "_blank" },
  { name: "My GitHub", href: props.data.url.githubAccount, rel: "noopener", target: "_blank" },
  { name: "Size Up - Org.", href: props.data.url.githubOrganization, rel: "noopener", target: "_blank" },
  { name: "Size Up - Documentation", href: props.data.url.sizeUpDocumentation, rel: "noopener", target: "_blank" },
];

const mobileMenuOpen: Ref<boolean> = ref(false);
</script>
