import { expect, test } from "../../support/fixtures";
import { routes } from "../../configuration";

const tools = [
  { name: "TaskHold’em", path: routes.taskHoldemLanding },
  { name: "IT Facts", path: routes.itFactsLanding },
  { name: "GitHub History Cleaner", path: routes.githubHistoryCleaner },
];

test.beforeEach(async ({ page }) => {
  await page.goto(routes.tools);
});

for (const tool of tools) {
  test(`catalog navigates to ${tool.name}`, async ({ page }) => {
    await expect(page).toHaveTitle(/^Tools \|/);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Tools", exact: true, level: 1 })).toBeVisible();
    const collection = main.getByRole("list", { name: "Available tools" });
    await expect(collection.getByRole("link")).toHaveCount(tools.length);
    await expect(collection.getByRole("heading", { level: 2 })).toHaveText(tools.map(entry => entry.name));

    const link = collection.getByRole("link", { name: tool.name, exact: true });
    await expect(link).toHaveAttribute("href", tool.path);
    await link.click();
    await expect(page).toHaveURL(tool.path);
    await expect(main.getByRole("heading", { name: tool.name, exact: true, level: 1 })).toBeVisible();
  });
}

test("cards support keyboard navigation and reduced motion", async ({ page, browserName }) => {
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
  await expect(page).toHaveURL(routes.githubHistoryCleaner);
});

test("showcase fits the project's viewport and keeps illustrations inside cards", async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const width = page.viewportSize()?.width;
  expect(width).toBeDefined();
  const main = page.getByRole("main");
  const cards = main.getByRole("list", { name: "Available tools" }).getByRole("link");
  await expect(cards).toHaveCount(tools.length);
  const bounds = await cards.evaluateAll(elements => elements.map(element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  }));
  const first = bounds[0]!;
  for (const [index, card] of bounds.entries()) {
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(width!);
    expect(card.width).toBeCloseTo(first.width, 0);
    if (width! >= 1024) {
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
  expect(await main.locator(".tool-preview").evaluateAll(elements => elements.every(element => {
    const frame = element.getBoundingClientRect();
    const illustration = element.firstElementChild?.getBoundingClientRect();
    return illustration && illustration.top > frame.top && illustration.bottom < frame.bottom
      && illustration.left > frame.left && illustration.right < frame.right;
  }))).toBe(true);
});
