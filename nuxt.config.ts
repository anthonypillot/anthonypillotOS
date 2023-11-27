// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "anthonypillotOS - Personal portfolio",
      meta: [
        {
          name: "description",
          content: "Personal portfolio of Anthony Pillot, Software Engineer",
        },
      ],
    },
  },

  css: ["@/assets/scss/main.scss"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/_variables.scss" as *;',
        },
      },
    },
  },

  devtools: { enabled: true },
});
