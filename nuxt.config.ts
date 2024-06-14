import { author, description } from "./package.json";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    app: {
      website: {
        title: "anthonypillotOS",
        description: description,
        url: author.url,
        logo: {
          hero: {
            white: "https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_white.svg",
            black: "https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_black.svg",
          },
          os: {
            raw: "https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_OS.svg",
            cutted: "https://raw.githubusercontent.com/anthonypillot/assets/main/logo/svg/logo_anthonypillotOS_OS_cutted.svg",
          },
        },
        author: {
          name: author.name,
          url: author.url,
          email: author.email,
        },
        link: {
          linkedIn: "https://linkedin.com/in/anthony-pillot",
          githubAccount: "https://github.com/anthonypillot",
          githubRepository: "https://github.com/anthonypillot/anthonypillotOS",
          githubOrganization: "https://github.com/size-up",
          githubFreeGamesCatcherCore: "https://github.com/size-up/freegamescatcher-core",
          sizeUpDocumentation: "https://docs.sizeup.cloud",
          status: "https://status.monitoring.anthonypillot.com",
        },
      },
    },
  },

  css: ["@/assets/scss/main.scss"],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/_variables.scss" as *;',
        },
      },
    },
  },

  routeRules: {
    "/": { prerender: true, swr: true },
  },

  modules: ["@nuxt/image", "@nuxt/test-utils/module", "@nuxtjs/tailwindcss"],

  devtools: { enabled: true },
});
