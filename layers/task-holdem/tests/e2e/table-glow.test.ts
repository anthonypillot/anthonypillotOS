import { expect, test } from "./support/fixtures";

test("the table keeps one shared glow frame through reveal and restart", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const frame = alice.page.getByTestId("round-border-glow");
  const table = alice.page.getByRole("region", { name: "Current round", exact: true });
  await expect(alice.page.locator("[data-border-glow]")).toHaveCount(1);
  await expect(frame.getByRole("region", { name: "Current round", exact: true })).toBeVisible();
  await expect(frame).toHaveCSS("border-top-width", "1px");
  await expect(frame).toHaveCSS("border-radius", "16px");
  await expect(frame).toHaveCSS("overflow", "visible");
  await expect(table).toHaveCSS("border-top-width", "0px");
  const topicSurface = await alice.page.getByRole("region", { name: "Current topic", exact: true }).evaluate(element => getComputedStyle(element).backgroundColor);
  await expect(table).toHaveCSS("background-color", topicSurface);
  const glow = frame.locator(":scope > span");
  await expect(glow).toHaveCSS("pointer-events", "none");
  await expect(glow).toHaveCSS("transition", "none");
  const handle = await frame.elementHandle();
  expect(handle).not.toBeNull();
  await alice.vote(8);
  await alice.reveal.focus();
  await expect(alice.reveal).toBeFocused();
  await alice.page.keyboard.press("Enter");
  await expect(table.getByText("Average: 8", { exact: true })).toBeVisible();
  expect(await handle!.evaluate(element => element.isConnected)).toBe(true);
  await alice.restart.focus();
  await alice.page.keyboard.press("Enter");
  await expect(table.getByRole("heading", { name: "Round 2", exact: true })).toBeVisible();
  expect(await handle!.evaluate(element => element.isConnected)).toBe(true);
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("the table glow follows the pointer without intercepting its controls", async ({ roomId, createPlayer, isMobile }) => {
  test.skip(isMobile, "Pointer-following glow is exercised on desktop; touch layouts retain a static frame.");
  const alice = await createPlayer(roomId, "Alice");
  const frame = alice.page.getByTestId("round-border-glow");
  const glow = frame.locator(":scope > span");
  await frame.scrollIntoViewIfNeeded();
  await alice.page.mouse.move(0, 0);
  await expect(glow).toHaveCSS("opacity", "0");
  const bounds = await frame.boundingBox();
  await alice.page.mouse.move(bounds!.x + 2, bounds!.y + bounds!.height / 2);
  await expect.poll(async () => Number(await glow.evaluate(element => getComputedStyle(element).opacity))).toBeGreaterThan(0.8);
  await alice.page.mouse.move(0, 0);
  await expect(glow).toHaveCSS("opacity", "0");
  await alice.vote(13);
  await alice.revealCards();
  await expect(alice.page.getByText("Average: 13", { exact: true })).toBeVisible();
});

test("the table intro respects reduced motion and cleans up when leaving the workspace", async ({ roomId, createPlayer, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || isMobile, "Exercise the shared intro lifecycle once; every profile checks its reduced-motion frame.");
  const alice = await createPlayer(roomId, "Alice");
  const errors: string[] = [];
  alice.page.on("pageerror", error => errors.push(error.message));
  const frame = alice.page.getByTestId("round-border-glow");
  const glow = frame.locator(":scope > span");
  await frame.scrollIntoViewIfNeeded();
  await alice.page.mouse.move(0, 0);
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => Number(await glow.evaluate(element => getComputedStyle(element).opacity))).toBeGreaterThan(0.2);
  await alice.page.emulateMedia({ reducedMotion: "reduce" });
  await expect(glow).toHaveCSS("opacity", "0");
  await expect(glow).toHaveCSS("transition", "none");
  await alice.page.getByRole("link", { name: "anthonypillotOS home", exact: true }).click();
  await expect(alice.page.locator("[data-border-glow]")).toHaveCount(5);
  expect(errors).toEqual([]);
});
