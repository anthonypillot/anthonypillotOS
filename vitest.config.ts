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
    include: ["server/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    coverage: {
      include: ["server/**/*.{js,ts}"],
    },
  },
});
