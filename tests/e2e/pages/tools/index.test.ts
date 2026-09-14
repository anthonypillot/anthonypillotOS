import { expect, test } from "@playwright/test";
import { currentUrl } from "../../configuration";

const tools = [
  { name: "TaskHold’em", path: "/tools/task-holdem" },
  { name: "IT Facts", path: "/tools/it-facts" },
  { name: "GitHub History Cleaner", path: "/tools/github/history-cleaner" },
];

test("catalog exposes each tool and navigates to its landing page", async ({ page }) => {
  for (const tool of tools) {
    await page.goto(`${currentUrl}/tools`, { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/^Tools \|/);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Tools", exact: true, level: 1 })).toBeVisible();
    const collection = main.getByRole("list", { name: "Available tools" });
    await expect(collection.getByRole("link")).toHaveCount(3);
    await expect(collection.getByRole("heading", { level: 2 })).toHaveText(tools.map(entry => entry.name));

    const link = collection.getByRole("link", { name: tool.name, exact: true });
    await expect(link).toHaveAttribute("href", tool.path);
    await link.click();
    await expect(page).toHaveURL(`${currentUrl}${tool.path}`);
    await expect(main.getByRole("heading", { name: tool.name, exact: true, level: 1 })).toBeVisible();
  }
});

test("cards support keyboard navigation and reduced motion", async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${currentUrl}/tools`, { waitUntil: "networkidle" });
  const links = page.getByRole("list", { name: "Available tools" }).getByRole("link");
  await links.first().focus();

  for (let index = 0; index < tools.length; index++) {
    const link = links.nth(index);
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-width", "2px");
    await expect(link).toHaveCSS("transition-duration", "0s");
    // WebKit uses Option+Tab to include links in sequential keyboard navigation.
    if (index < tools.length - 1) await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  }

  await links.last().hover();
  await expect(links.last()).toHaveCSS("transform", "none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${currentUrl}/tools/github/history-cleaner`);
});

test("showcase fits narrow screens and balances desktop cards", async ({ page }, testInfo) => {
  for (const width of [320, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${currentUrl}/tools`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const main = page.getByRole("main");
    const cards = main.getByRole("list", { name: "Available tools" }).getByRole("link");
    const bounds = await cards.evaluateAll(elements => elements.map(element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    }));
    expect(bounds).toHaveLength(3);
    const first = bounds[0]!;
    for (const [index, card] of bounds.entries()) {
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(width);
      expect(card.width).toBeCloseTo(first.width, 0);
      if (width >= 1024) {
        expect(card.y).toBeCloseTo(first.y, 0);
        expect(card.height).toBeCloseTo(first.height, 0);
        if (index > 0) expect(card.x).toBeGreaterThan(bounds[index - 1]!.x + bounds[index - 1]!.width);
      } else if (index > 0) {
        expect(card.y).toBeGreaterThan(bounds[index - 1]!.y + bounds[index - 1]!.height);
      }
    }

    const header = await page.getByRole("navigation", { name: "Global", exact: true }).boundingBox();
    const eyebrow = await main.getByText("Free & open source", { exact: true }).boundingBox();
    expect(header).not.toBeNull();
    expect(eyebrow).not.toBeNull();
    expect(eyebrow!.y).toBeGreaterThan(header!.y + header!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    const previews = main.locator(".tool-preview");
    expect(await previews.evaluateAll(elements => elements.every(element => {
      const frame = element.getBoundingClientRect();
      const illustration = element.firstElementChild?.getBoundingClientRect();
      return illustration && illustration.top > frame.top && illustration.bottom < frame.bottom
        && illustration.left > frame.left && illustration.right < frame.right;
    }))).toBe(true);

    if (width === 320 || width === 1280) {
      await testInfo.attach(`tools-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  }
});
