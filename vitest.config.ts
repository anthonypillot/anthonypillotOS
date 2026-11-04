import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        // Match Nitro 2; the root H3 v2 dependency from ESLint tooling can mislead auto-detection.
        h3Version: 1,
      },
    },
    include: ["server/**/*.{test,spec}.?(c|m)[jt]s?(x)", "layers/*/tests/unit/**/*.nuxt.test.ts"],
    coverage: {
      include: ["server/**/*.{js,ts}", "layers/*/server/**/*.{js,ts}"],
      exclude: ["server/generated/**"],
    },
  },
});
