<template>
  <footer class="bg-gray-900" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Footer</h2>
    <div class="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
      <div class="xl:grid xl:grid-cols-3 xl:gap-8">
        <NuxtImg
          format="webp"
          quality="80"
          class="h-7"
          src="https://raw.githubusercontent.com/anthonypillot/assets/78c3327a009fa95b72dd06dac4bbc3e811f5a1c3/logo/svg/logo_anthonypillotOS_OS.svg"
          alt="anthonypillotOS"
          style="filter: invert(1)"
        />
        <div class="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
          <div class="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 class="text-sm font-semibold leading-6 text-white">GitHub</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in footerNavigation.github" :key="item.name">
                  <a :href="item.href" :rel="item.rel" :target="item.target" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</a>
                </li>
              </ul>
            </div>
            <div class="mt-10 md:mt-0">
              <h3 class="text-sm font-semibold leading-6 text-white">Project</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in footerNavigation.project" :key="item.name">
                  <a :href="item.href" :rel="item.rel" :target="item.target" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</a>
                </li>
              </ul>
            </div>
          </div>
          <div class="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 class="text-sm font-semibold leading-6 text-white">Contact</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in footerNavigation.contact" :key="item.name">
                  <a :href="item.href" :rel="item.rel" :target="item.target" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</a>
                </li>
              </ul>
            </div>
            <!-- <div class="mt-10 md:mt-0">
                <h3 class="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.legal" :key="item.name">
                    <a :href="item.href" class="text-sm leading-6 text-gray-300 hover:text-white">{{ item.name }}</a>
                  </li>
                </ul>
              </div> -->
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
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

const footerNavigation = {
  github: [
    { name: "Account", href: props.data.url.githubAccount, rel: "noopener", target: "_blank" },
    { name: "Repository", href: props.data.url.githubRepository, rel: "noopener", target: "_blank" },
    { name: "Organization", href: props.data.url.githubOrganization, rel: "noopener", target: "_blank" },
  ],
  project: [
    { name: "Size Up - Documentation", href: props.data.url.sizeUpDocumentation, rel: "noopener", target: "_blank" },
    { name: "Free Games Catcher", href: props.data.url.githubFreeGamesCatcherCore, rel: "noopener", target: "_blank" },
  ],
  contact: [
    { name: "Email", href: "mailto:" + props.data.email.owner },
    { name: "LinkedIn", href: props.data.url.linkedIn, rel: "noopener", target: "_blank" },
    { name: "GitHub", href: props.data.url.githubAccount, rel: "noopener", target: "_blank" },
  ],
};
</script>
