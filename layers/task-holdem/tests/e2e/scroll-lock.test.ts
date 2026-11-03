import type { Page } from "@playwright/test";
import { routes } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/fixtures";

test.skip(({ browserName, isMobile, hasTouch }) => browserName !== "chromium" || isMobile || hasTouch, "Exercise classic desktop scrollbar geometry once; touch devices use overlay scrollbars.");
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

async function prepareScrollbar(page: Page, width: number, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.addStyleTag({ content: "html::-webkit-scrollbar { width: 16px; }" });
  await page.evaluate(() => document.fonts.ready);
}

async function readLayout(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector(".floating-header");
    const main = document.querySelector("main");
    if (!header || !main) throw new Error("The page header and content are required.");
    const headerBounds = header.getBoundingClientRect();
    const contentBounds = main.getBoundingClientRect();
    return {
      header: { x: headerBounds.x, y: headerBounds.y, width: headerBounds.width },
      content: { x: contentBounds.x, width: contentBounds.width },
      scrollY: window.scrollY,
    };
  });
}

type PageLayout = Awaited<ReturnType<typeof readLayout>>;

async function expectLockedLayout(page: Page, baseline: PageLayout): Promise<void> {
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect.poll(() => readLayout(page)).toEqual(baseline);
  await page.mouse.move(2, (page.viewportSize()?.height ?? 900) - 10);
  await page.mouse.wheel(0, 300);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await readLayout(page)).toEqual(baseline);
}

for (const width of [1440, 1100]) {
  test(`voting scale selection preserves the header and content with a classic scrollbar at ${width}px`, async ({ page }) => {
    await page.goto(routes.taskHoldem);
    await prepareScrollbar(page, width);
    const scrollbarWidth = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
    expect(scrollbarWidth).toBeGreaterThan(0);
    const picker = page.getByRole("combobox", { name: "Voting scale", exact: true });
    await picker.scrollIntoViewIfNeeded();
    await picker.focus();
    const baseline = await readLayout(page);
    await picker.press("Space");
    await expect(page.getByRole("listbox")).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--scrollbar-width"))).toBe(`${scrollbarWidth}px`);
    await expectLockedLayout(page, baseline);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await expect(picker).toBeFocused();
    await expect.poll(() => readLayout(page)).toEqual(baseline);

    const tools = page.getByRole("navigation", { name: "Global", exact: true }).getByRole("button", { name: "Tools", exact: true });
    await tools.click();
    await expect(page.getByRole("navigation", { name: "Tools", exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    expect(await readLayout(page)).toEqual(baseline);
    await page.keyboard.press("Escape");
    await expect(tools).toBeFocused();
  });

  test(`feedback preserves the header and background scroll position at ${width}px`, async ({ roomId, createPlayer }) => {
    const alice = await createPlayer(roomId, "Alice");
    const page = alice.page;
    await prepareScrollbar(page, width);
    expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, 120));
    const trigger = page.getByRole("button", { name: "Send feedback", exact: true });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    const baseline = await readLayout(page);
    expect(baseline.scrollY).toBeGreaterThan(0);
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Feedback", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
    await expectLockedLayout(page, baseline);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await expect(trigger).toBeFocused();
    await expect.poll(() => readLayout(page)).toEqual(baseline);
    await page.mouse.wheel(0, -120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(baseline.scrollY);
  });
}

test("opening a menu without a scrollbar does not add an empty gutter", async ({ page }) => {
  await page.goto(routes.taskHoldem);
  await prepareScrollbar(page, 1440, 6000);
  expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBe(0);
  const picker = page.getByRole("combobox", { name: "Voting scale", exact: true });
  await picker.focus();
  const baseline = await readLayout(page);
  await picker.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expectLockedLayout(page, baseline);
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(picker).toBeFocused();
  await expect.poll(() => readLayout(page)).toEqual(baseline);
});
