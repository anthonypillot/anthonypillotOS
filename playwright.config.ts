import { defineConfig, devices } from "@playwright/test";
import { baseURL, databaseURL } from "./tests/e2e/configuration";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.test.ts",
  tsconfig: "./tests/e2e/tsconfig.json",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    [process.env.CI ? "github" : "list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    baseURL,
    colorScheme: "dark",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "Desktop - Chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Desktop - Firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "Desktop - Safari", use: { ...devices["Desktop Safari"] } },
    { name: "Tablet Safari - iPad", use: { ...devices["iPad (gen 7)"] } },
    { name: "Mobile Chrome - Samsung Galaxy S24", use: { ...devices["Galaxy S24"] } },
    { name: "Mobile Safari - iPhone 15", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: "node tests/e2e/start-server.ts",
    url: `${baseURL}/api/health/live`,
    reuseExistingServer: false,
    timeout: 60_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    env: {
      HOST: "127.0.0.1",
      PORT: "4173",
      POSTGRES_PRISMA_URL: databaseURL,
      ENV: "e2e",
      LOG_LEVEL: "info",
    },
  },
});
