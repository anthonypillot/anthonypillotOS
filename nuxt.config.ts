import { author, description, version } from "./package.json";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    app: {
      website: {
        title: "anthonypillotOS",
        description,
        url: author.url,
        version,
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

  compatibilityDate: "2024-07-25",

  css: ["@/assets/css/main.css"],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/css/_variables.css" as *;',
        },
      },
    },
  },

  routeRules: {
    "/": { swr: 21600 }, // Homepage generated on demand, revalidates in background, cached for 6 hours (21600 seconds)
    "/tools/github/history-cleaner": { swr: 21600 }, // Page generated on demand, revalidates in background, cached for 6 hours (21600 seconds),
  },

  modules: ["@nuxt/image", "@nuxt/test-utils/module", "@nuxtjs/tailwindcss"],

  devtools: { enabled: true },
});
