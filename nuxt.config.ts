import { author, description, version } from "./package.json";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
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

  compatibilityDate: "2025-03-15",

  css: ["~/assets/css/main.css"],

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  routeRules: {
    "/": { swr: true },
    "/tools/github/history-cleaner": { swr: true },
    "/tools/task-holdem": { swr: true },
  },

  modules: ["@nuxt/ui", "@nuxt/image", "@nuxt/test-utils/module"],

  devtools: { enabled: true },
});
