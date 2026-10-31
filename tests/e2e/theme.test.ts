import { routes } from "./configuration";
import { expect, test } from "./support/fixtures";
import { expectReadableContrast } from "./support/contrast";

const pages = [
  { name: "home", path: routes.home },
  { name: "tool catalog", path: routes.tools },
  { name: "History Cleaner", path: routes.githubHistoryCleaner },
  { name: "IT Facts introduction", path: routes.itFactsLanding },
  { name: "IT Facts game", path: routes.itFacts },
  { name: "Task Hold'em introduction", path: routes.taskHoldemLanding },
  { name: "Task Hold'em admission", path: routes.taskHoldem },
  { name: "error page", path: "/theme-test-missing-page" },
];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} system appearance`, () => {
    test.use({ colorScheme });

    test.beforeEach(async ({ context }) => {
      await context.addInitScript(() => {
        if (location.protocol === "http:" || location.protocol === "https:") localStorage.setItem("nuxt-color-mode", "light");
      });
    });

    for (const { name, path } of pages) {
      test(`${name} stays dark from server render through hydration with readable text`, async ({ page, request }) => {
        const response = await request.get(path);
        expect(await response.text()).toMatch(/<html\b[^>]*class="[^"]*\bdark\b/);
        await page.goto(path);
        await expect(page.locator("html")).toHaveClass(/\bdark\b/);
        await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
        await expectReadableContrast(page);
      });
    }

    test("navigation and the technology drawer share the global theme", async ({ page }) => {
      await page.goto(routes.home);
      await page.getByRole("button", { name: /View \d+ technologies and tools used at Claim/ }).click();
      await expect(page.getByRole("button", { name: "Close Claim technologies" })).toBeVisible();
      await expectReadableContrast(page);
      await page.getByRole("button", { name: "Close Claim technologies" }).click();

      const mobile = (page.viewportSize()?.width ?? 0) < 1024;
      await page.getByRole("navigation", { name: "Global", exact: true })
        .getByRole("button", { name: mobile ? "Open main menu" : "Tools", exact: true }).click();
      const menu = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Tools", exact: true });
      await expect(menu).toBeVisible();
      await expectReadableContrast(page);
      await menu.getByRole("link", { name: /IT Facts/ }).click();
      await expect(page).toHaveURL(routes.itFactsLanding);
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    });

    test("History Cleaner confirmation stays readable above the page", async ({ page }) => {
      await page.goto(routes.githubHistoryCleaner);
      await page.getByLabel("Account name or organization").fill("theme-test");
      await page.getByLabel("Repository", { exact: true }).fill("example");
      await page.getByLabel("GitHub Personal Access Token (PAT)", { exact: true }).fill("ghp_theme-test");
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Confirm deletion" })).toBeVisible();
      await expectReadableContrast(page);
    });
  });
}
