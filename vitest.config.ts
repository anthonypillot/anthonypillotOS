import { defineVitestConfig } from "@nuxt/test-utils/config";

/**
 * Represents the configuration for Vitest.
 * It only cover the server side.
 *
 * @see https://nuxt.com/docs/getting-started/testing
 */
export default defineVitestConfig({
  test: {
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        // Match Nitro 2; the root H3 v2 dependency from ESLint tooling can mislead auto-detection.
        h3Version: 1,
      },
    },
    include: ["server/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    coverage: {
      include: ["server/**/*.{js,ts}"],
    },
  },
});
