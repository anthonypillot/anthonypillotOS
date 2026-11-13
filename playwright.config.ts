import { defineConfig, devices } from "@playwright/test";
import { baseURL } from "./tests/e2e/support/configuration";

export default defineConfig({
  testDir: ".",
  testMatch: "**/tests/e2e/**/*.test.ts",
  tsconfig: "./tests/e2e/tsconfig.json",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 6,
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
    command: "node tests/e2e/support/server.ts",
    wait: { stdout: /\[E2E\] Environment ready/ },
    reuseExistingServer: false,
    timeout: 240_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 45_000 },
    stdout: "pipe",
    stderr: "pipe",
  },
});
