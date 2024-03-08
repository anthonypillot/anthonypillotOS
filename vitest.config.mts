import { defineVitestConfig } from "@nuxt/test-utils/config";

/**
 * Represents the configuration for Vitest.
 * It only cover the server side.
 */
export default defineVitestConfig({
  test: {
    include: ["server/**/*.{test,spec}.?(c|m)[jt]s?(x)"],

    coverage: {
      include: ["server/**/*.{js,ts}"],
    },
  },
});
