<template>
  <footer class="bg-gray-900" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Footer</h2>
    <div class="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
      <div class="xl:grid xl:grid-cols-3 xl:gap-8">
        <NuxtImg quality="80" class="h-7" :src="logo" :alt="config.app.website.title" style="filter: invert(1)" />
        <div class="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
          <div class="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 class="text-sm font-semibold leading-6 text-white">Application</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in navigation.application" :key="item.name">
                  <NuxtLink v-if="item.internal" :to="item.href" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</NuxtLink>
                  <a
                    v-else
                    :href="item.href"
                    :rel="item.rel"
                    :target="item.target"
                    class="text-sm leading-6 text-gray-300 hover:text-white"
                    >{{ item.name }}</a
                  >
                </li>
              </ul>
            </div>
            <div class="mt-10 md:mt-0">
              <h3 class="text-sm font-semibold leading-6 text-white">Project</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in navigation.project" :key="item.name">
                  <a :href="item.href" :rel="item.rel" :target="item.target" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</a>
                </li>
              </ul>
            </div>
          </div>
          <div class="md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h3 class="text-sm font-semibold leading-6 text-white">GitHub</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in navigation.github" :key="item.name">
                  <a :href="item.href" :rel="item.rel" :target="item.target" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</a>
                </li>
              </ul>
            </div>
            <div class="mt-10 md:mt-0">
              <h3 class="text-sm font-semibold leading-6 text-white">Contact</h3>
              <ul role="list" class="mt-6 space-y-4">
                <li v-for="item in navigation.contact" :key="item.name">
                  <a :href="item.href" :rel="item.rel" :target="item.target" class="text-sm leading-6 text-gray-300 hover:text-white">{{
                    item.name
                  }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const logo = config.app.website.logo.os.raw;

const navigation = {
  github: [
    { name: "Account", href: config.app.website.link.githubAccount, rel: "noopener", target: "_blank" },
    { name: "Repository", href: config.app.website.link.githubRepository, rel: "noopener", target: "_blank" },
    { name: "Organization", href: config.app.website.link.githubOrganization, rel: "noopener", target: "_blank" },
  ],
  project: [
    { name: "Size Up - Documentation", href: config.app.website.link.sizeUpDocumentation, rel: "", target: "_blank" },
    { name: "Free Games Catcher", href: config.app.website.link.githubFreeGamesCatcherCore, rel: "noopener", target: "_blank" },
  ],
  contact: [
    { name: "Email", href: "mailto:" + config.app.website.author.email },
    { name: "LinkedIn", href: config.app.website.link.linkedIn, rel: "noopener", target: "_blank" },
  ],
  application: [
    { name: "GitHub History Cleaner", href: "/tools/github/history-cleaner", rel: "", target: "", internal: true },
    { name: "Status", href: config.app.website.link.status, rel: "", target: "_blank" },
  ],
};
</script>
