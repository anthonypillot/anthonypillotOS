import { expect, test } from "@playwright/test";
import { currentUrl } from "./configuration";

test("floating navigation supports tool navigation and keyboard dismissal", async ({ page }) => {
  await page.goto(`${currentUrl}/tools`, { waitUntil: "networkidle" });

  const header = page.getByRole("navigation", { name: "Global", exact: true });
  const mobile = (page.viewportSize()?.width ?? 0) < 1024;
  const trigger = header.getByRole("button", { name: mobile ? "Open main menu" : "Tools", exact: true });
  const menu = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Tools", exact: true });

  await expect(header).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: /TaskHold’em/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: /GitHub History Cleaner/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: "View all tools" })).toHaveAttribute("href", "/tools");

  if (mobile) {
    await expect(menu.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("target", "_blank");
    await expect(menu.getByRole("link", { name: "GitHub repository" })).toBeVisible();
  }

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await menu.getByRole("link", { name: /IT Facts/ }).click();
  await expect(page).toHaveURL(`${currentUrl}/tools/it-facts`);
  await expect(menu).toBeHidden();

  await trigger.click();
  await expect(menu.getByRole("link", { name: /IT Facts/ })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");

  const beforeScroll = await header.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const afterScroll = await header.boundingBox();
  expect(afterScroll?.y).toBe(beforeScroll?.y);
  await expect(header).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("mobile dropdown stays within a small viewport and closes outside or across breakpoints", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${currentUrl}/tools`, { waitUntil: "networkidle" });

  const header = page.getByRole("navigation", { name: "Global", exact: true });
  const trigger = header.getByRole("button", { name: "Open main menu" });
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  const panel = page.getByRole("dialog");

  await trigger.click();
  await expect(menu).toBeVisible();
  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(568);
  await menu.getByRole("link", { name: "GitHub repository" }).scrollIntoViewIfNeeded();
  await expect(menu.getByRole("link", { name: "GitHub repository" })).toBeInViewport();

  await page.mouse.click(2, 300);
  await expect(menu).toBeHidden();
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(menu).toBeHidden();

  await header.getByRole("button", { name: "Tools", exact: true }).click();
  const toolsMenu = page.getByRole("navigation", { name: "Tools", exact: true });
  await expect(toolsMenu).toBeVisible();
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(toolsMenu).toBeHidden();
  await expect(trigger).toBeVisible();
});
