export default defineNuxtConfig({
  nitro: {
    experimental: {
      websocket: true,
    },
  },

  routeRules: {
    "/tools/task-holdem": { swr: true },
  },
});
