import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: "http://127.0.0.1:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "Desktop - Chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "Desktop - Firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "Desktop - Safari",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against tablet viewports. */
    {
      name: "Tablet Safari - iPad",
      use: { ...devices["iPad (gen 7)"] },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome - Google Pixel 5",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari - iPhone 12",
      use: { ...devices["iPhone 12"] },
    },

    /* Test against branded browsers. */
    // {
    //   name: "Microsoft Edge",
    //   use: { ...devices["Desktop Edge"], channel: "msedge" },
    // },
    // {
    //   name: "Google Chrome",
    //   use: { ...devices["Desktop Chrome"], channel: "chrome" },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: getWebServerConfig(),
});

function getWebServerConfig(): { command: string; url: string; reuseExistingServer: boolean } | undefined {
  if (process.env.CI) {
    return undefined;
  } else {
    return {
      command: "npm run start",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
    };
  }
}
