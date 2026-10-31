import { routes } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/task-holdem";

test("admission lists its benefits in the requested order", async ({ page, roomId }) => {
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(page.getByText("Made for your next planning session", { exact: true })).toHaveCount(0);
  const teamwork = page.getByText("Real-time collaboration", { exact: true });
  const account = page.getByText("No account needed", { exact: true });
  await expect(account).toHaveCount(1);
  await expect(account.locator("..").locator(":scope > span")).toHaveText(["No account needed", "Real-time collaboration", "Private votes"]);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(teamwork).toBeVisible();
    await expect(account).toBeVisible();
    const teamworkBounds = await teamwork.boundingBox();
    const accountBounds = await account.boundingBox();
    expect(teamworkBounds!.x).toBeGreaterThanOrEqual(accountBounds!.x + accountBounds!.width);
  }
});

test("workspace starts two rem higher while clearing the floating navigation", async ({ page }) => {
  await page.goto(routes.taskHoldem);
  const workspace = page.locator(".task-workspace");
  await expect(workspace).toHaveCSS("padding-top", (page.viewportSize()?.width ?? 0) < 640 ? "96px" : "112px");
  const navigation = await page.getByRole("navigation", { name: "Global", exact: true }).boundingBox();
  const heading = await workspace.locator(":scope > header").boundingBox();
  expect(heading!.y).toBeGreaterThan(navigation!.y + navigation!.height);
});

test("the six-column card grid has more breathing room than the single-row deck", async ({ roomId, createPlayer, isMobile }) => {
  test.skip(isMobile, "Desktop profiles exercise both responsive breakpoints; mobile keeps its swipeable deck.");
  const alice = await createPlayer(roomId, "Alice");
  await alice.page.setViewportSize({ width: 1104, height: 1000 });
  const grid = alice.page.getByTestId("vote-card-grid");
  await expect(grid).toHaveCSS("column-gap", "16px");
  await expect(grid).toHaveCSS("row-gap", "16px");
  const cards = grid.getByRole("button");
  const first = await cards.nth(0).boundingBox();
  const seventh = await cards.nth(6).boundingBox();
  expect(seventh!.y - (first!.y + first!.height)).toBeCloseTo(16, 0);
  await alice.page.setViewportSize({ width: 1440, height: 1000 });
  await expect(grid).toHaveCSS("column-gap", "8px");
  const last = await cards.nth(11).boundingBox();
  const firstWide = await cards.nth(0).boundingBox();
  expect(last!.y).toBeCloseTo(firstWide!.y, 0);
});

test("all card suits use traditional ink colors and the selected marker is white", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  for (const suit of ["clubs", "spades", "diamonds", "hearts"]) {
    const symbols = alice.page.locator(`[data-suit="${suit}"]`);
    expect(await symbols.count()).toBeGreaterThan(0);
    for (const symbol of await symbols.all()) {
      await expect(symbol).toHaveCSS("color", suit === "diamonds" || suit === "hearts" ? "rgb(220, 38, 38)" : "rgb(0, 0, 0)");
      await expect(symbol).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
  }
  await expect(alice.page.getByRole("region", { name: "Your cards", exact: true }).locator("[data-suit]").first()).toHaveCSS("font-size", "16px");
  await alice.vote(8);
  const marker = alice.page.getByTestId("selected-card-marker");
  await expect(marker).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(marker).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("message counts use a white badge with dark text", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const badge = alice.page.getByTestId("chat-message-count");
  await expect(badge).toHaveCount(0);
  await alice.openChat();
  await alice.page.getByRole("textbox", { name: "Your message", exact: true }).fill("Ready to estimate");
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(badge).toHaveText("1");
  const colors = await badge.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas is required to resolve semantic colors");
    const style = getComputedStyle(element);
    context.fillStyle = style.backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const background = Array.from(context.getImageData(0, 0, 1, 1).data);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = style.color;
    context.fillRect(0, 0, 1, 1);
    return { background, foreground: Array.from(context.getImageData(0, 0, 1, 1).data) };
  });
  expect(colors.background).toEqual([255, 255, 255, 255]);
  expect(Math.max(...colors.foreground.slice(0, 3))).toBeLessThanOrEqual(48);
});

test("clipboard failure guidance stays to the right of the invitation button", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await alice.page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      async writeText() { throw new DOMException("Clipboard access denied", "NotAllowedError"); },
    } });
  });
  const invite = alice.page.getByRole("button", { name: "Invite players", exact: true });
  await invite.click();
  const guidance = alice.page.getByText("Copy the room URL from your address bar.", { exact: true });
  await expect(guidance).toBeVisible();
  const inviteBounds = await invite.boundingBox();
  const guidanceBounds = await guidance.boundingBox();
  expect(guidanceBounds!.x).toBeGreaterThanOrEqual(inviteBounds!.x + inviteBounds!.width);
  if ((alice.page.viewportSize()?.width ?? 0) >= 1024) {
    const feedbackBounds = await alice.page.getByRole("button", { name: "Send feedback", exact: true }).boundingBox();
    expect(feedbackBounds!.x - (guidanceBounds!.x + guidanceBounds!.width)).toBeCloseTo(4, 0);
    await expect(guidance).toHaveCSS("white-space", "nowrap");
  }
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
