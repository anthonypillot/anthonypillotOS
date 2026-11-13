import { routes } from "./support/configuration";
import { expect, test } from "./support/fixtures";
import { readSurfaceContrast } from "./support/contrast";

test.skip(({ isMobile, hasTouch }) => isMobile || hasTouch, "Surface colors are shared across viewports; there is no touch-specific behavior.");

test("experience cards keep their boundaries, highlights and action surfaces without the animated glow", async ({ page }) => {
  await page.goto(routes.home);
  await page.mouse.move(0, 0);
  const cards = page.getByRole("region", { name: "Career history", exact: true }).locator("article");
  await expect(cards).toHaveCount(5);

  // Decorative boundaries use a regression floor; text contrast is checked separately by Axe.
  for (const card of await cards.all()) {
    const panel = card.locator("[data-border-glow]");
    const website = card.getByRole("link", { name: /^Visit .+ website$/ });
    const highlights = card.locator("ul > li");
    const technologies = card.getByRole("button", { name: /^View \d+ technologies and tools used at / });
    await expect(highlights).toHaveCount(3);
    expect((await readSurfaceContrast(panel)).border, "The card outline must not blend into its fill").toBeGreaterThan(1.2);
    expect((await readSurfaceContrast(website)).border, "Website links must retain their circular outline").toBeGreaterThan(1.2);

    for (const highlight of await highlights.all()) {
      const icon = highlight.locator(":scope > span").first();
      expect((await readSurfaceContrast(icon)).border, "Highlight icons must retain their frame").toBeGreaterThan(1.2);
      expect((await readSurfaceContrast(icon)).background, "Highlight icons must have a distinct surface").toBeGreaterThan(1.03);
    }
    for (const divider of (await highlights.all()).slice(0, -1)) {
      await expect(divider).toHaveCSS("border-bottom-width", "1px");
      expect((await readSurfaceContrast(divider, "bottom")).border, "Highlights must remain separated").toBeGreaterThan(1.2);
    }
    expect((await readSurfaceContrast(card.locator(".h-px"))).background, "The description must retain its separator").toBeGreaterThan(1.2);
    expect((await readSurfaceContrast(technologies)).border, "The technology action must retain its top divider").toBeGreaterThan(1.2);
    expect((await readSurfaceContrast(technologies)).background, "The technology action must be distinct from the card body").toBeGreaterThan(1.03);
  }
});

test("experience actions retain hover feedback and a high-contrast keyboard focus indicator", async ({ page }) => {
  await page.goto(routes.home);
  const card = page.getByRole("region", { name: "Career history", exact: true }).locator("article").first();
  const technologies = card.getByRole("button", { name: /^View \d+ technologies and tools used at Claim$/ });
  const resting = await readSurfaceContrast(technologies);
  await technologies.hover();
  await expect.poll(async () => (await readSurfaceContrast(technologies)).background).toBeGreaterThan(resting.background);
  await page.mouse.move(0, 0);
  await technologies.focus();
  await expect(technologies).toBeFocused();
  await expect(technologies).toHaveCSS("outline-style", "solid");
  expect((await readSurfaceContrast(technologies)).outline).toBeGreaterThanOrEqual(3);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close Claim technologies", exact: true })).toBeVisible();
});

test("shared borders stay visible on tool cards and raised voting scale cards", async ({ page }) => {
  await page.goto(routes.tools);
  const tools = page.locator(".tool-card");
  await expect(tools).toHaveCount(3);
  for (const tool of await tools.all()) {
    expect((await readSurfaceContrast(tool)).border, "Tool outlines must remain visible against their raised surface").toBeGreaterThan(1.2);
  }

  await page.goto(routes.taskHoldem);
  const cards = page.getByRole("list", { name: "Cards in this voting scale", exact: true }).getByRole("listitem");
  await expect(cards).toHaveCount(12);
  for (const card of await cards.all()) {
    expect((await readSurfaceContrast(card)).border, "Card outlines must not share their fill color").toBeGreaterThan(1.2);
  }
});
