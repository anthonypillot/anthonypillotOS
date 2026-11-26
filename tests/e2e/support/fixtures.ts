import { test as base, type Page } from "@playwright/test";

type Fixtures = {
  diagnostics: string[];
  captureDiagnostics: undefined;
};

export function capturePageDiagnostics(page: Page, logs: string[]): void {
  page.on("console", message => {
    if (message.type() === "error" || message.type() === "warning") {
      logs.push(`[${message.type()}] ${page.url()}: ${message.text()}`);
    }
  });
  page.on("pageerror", error => logs.push(`[pageerror] ${page.url()}: ${error.stack ?? error.message}`));
  page.on("requestfailed", request => logs.push(`[requestfailed] ${request.url()}: ${request.failure()?.errorText}`));
}

export const test = base.extend<Fixtures>({
  diagnostics: async ({ browserName }, use) => {
    await use([`Browser: ${browserName}`]);
  },
  captureDiagnostics: [async ({ context, diagnostics }, use, testInfo) => {
    context.on("page", page => capturePageDiagnostics(page, diagnostics));

    try {
      await use(undefined);
    } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach("browser-diagnostics", {
          body: diagnostics.join("\n") || "No browser warnings, errors, or failed requests captured.",
          contentType: "text/plain",
        });
      }
    }
  }, { auto: true }],
});

export { expect } from "@playwright/test";
