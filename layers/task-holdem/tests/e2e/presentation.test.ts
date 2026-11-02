import { routes } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/task-holdem";

test("connection indicator reads Connected before and after joining a room", async ({ page, roomId, createPlayer }) => {
  await page.goto(routes.taskHoldem);
  await expect(page.getByTestId("connection-status")).toHaveText("Connected");
  const alice = await createPlayer(roomId, "Alice");
  await expect(alice.page.getByTestId("connection-status")).toHaveText("Connected");
});

test("admission lists its benefits in the requested order", async ({ page, roomId }) => {
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(page.getByText("Take a seat", { exact: true })).toBeVisible();
  await expect(page.getByText("Your seat at the table", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Made for your next planning session", { exact: true })).toHaveCount(0);
  const teamwork = page.getByText("Real-time collaboration", { exact: true });
  const account = page.getByText("No account needed", { exact: true });
  await expect(account).toHaveCount(1);
  await expect(account.locator("..").locator(":scope > span")).toHaveText(["No account needed", "Real-time collaboration", "Private votes"]);
  const symbols = page.locator(".intro-card [data-suit]");
  await expect(symbols).toHaveCount(3);
  const primaryColor = await page.getByText("a conversation.", { exact: true }).evaluate(element => getComputedStyle(element).color);
  for (const symbol of await symbols.all()) {
    await expect(symbol).toHaveCSS("color", primaryColor);
    await expect(symbol).toHaveCSS("font-size", "14px");
    await expect(symbol).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(symbol).toHaveCSS("-webkit-text-stroke-width", "0px");
  }
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(teamwork).toBeVisible();
    await expect(account).toBeVisible();
    const teamworkBounds = await teamwork.boundingBox();
    const accountBounds = await account.boundingBox();
    expect(teamworkBounds!.x).toBeGreaterThanOrEqual(accountBounds!.x + accountBounds!.width);
  }
});

test("workspace keeps the base background and clears the floating navigation", async ({ page }) => {
  await page.goto(routes.taskHoldem);
  const workspace = page.locator("main > section");
  await expect(workspace).not.toHaveClass(/\btask-workspace\b/);
  const backdrop = await workspace.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return { content: style.content, background: style.backgroundImage };
  });
  expect(backdrop).toEqual({ content: "none", background: "none" });
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

test("all card suits use the original indigo styling and the selected marker stays white", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const primaryColor = await alice.page.getByRole("heading", { name: "Current topic", exact: true }).evaluate(element => getComputedStyle(element).color);
  const fontFamily = await alice.page.locator("body").evaluate(element => getComputedStyle(element).fontFamily);
  for (const suit of ["clubs", "spades", "diamonds", "hearts"]) {
    const symbols = alice.page.locator(`[data-suit="${suit}"]`);
    expect(await symbols.count()).toBeGreaterThan(0);
    for (const symbol of await symbols.all()) {
      await expect(symbol).toHaveCSS("color", primaryColor);
      await expect(symbol).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(symbol).toHaveCSS("-webkit-text-stroke-width", "0px");
      await expect(symbol).toHaveCSS("font-family", fontFamily);
    }
  }
  const voteSymbol = alice.page.getByRole("region", { name: "Your cards", exact: true }).locator("[data-suit]").first();
  await expect(voteSymbol).toHaveCSS("font-size", "12px");
  await expect(voteSymbol).toHaveCSS("opacity", "0.6");
  await expect(alice.page.getByRole("region", { name: "Current round", exact: true }).locator("[data-suit]").first()).toHaveCSS("font-size", "16px");
  await alice.vote(8);
  const marker = alice.page.getByTestId("selected-card-marker");
  await expect(marker).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(marker).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("the current participant uses a fine border without a ring", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await createPlayer(roomId, "Bob");
  const borderColor = await alice.page.getByRole("region", { name: "At the table", exact: true }).evaluate(element => getComputedStyle(element).borderTopColor);
  await expect(alice.player("Alice")).toHaveCSS("border-top-width", "1px");
  await expect(alice.player("Alice")).toHaveCSS("border-top-color", borderColor);
  await expect(alice.player("Alice")).toHaveCSS("box-shadow", "none");
  await expect(alice.player("Bob")).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
});

test("round preview cards use fine visible borders and keep the center tint", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const cards = alice.page.getByRole("region", { name: "Current round", exact: true }).locator(".preview-card");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS("border-top-width", "1px");
    await expect(card).toHaveCSS("border-top-style", "solid");
  }
  const accented = await alice.page.getByRole("button", { name: "Select 1 card", exact: true }).evaluate(element => getComputedStyle(element).borderTopColor);
  for (const index of [0, 2]) await expect(cards.nth(index)).toHaveCSS("border-top-color", accented);
  const centerAlpha = await cards.nth(1).evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas is required to resolve semantic colors");
    context.fillStyle = getComputedStyle(element).borderTopColor;
    context.fillRect(0, 0, 1, 1);
    return context.getImageData(0, 0, 1, 1).data[3];
  });
  expect(centerAlpha).toBe(102);
});

test("the sidebar sticks below navigation on desktop and scrolls normally on smaller screens", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await alice.page.evaluate(() => document.fonts.ready);
  await alice.page.evaluate(() => window.scrollTo(0, 0));
  const sidebar = alice.page.getByRole("complementary", { name: "Room sidebar", exact: true });
  const initial = await sidebar.boundingBox();
  if ((alice.page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(sidebar).toHaveCSS("position", "sticky");
    await expect(sidebar).toHaveCSS("top", "112px");
    for (const offset of [80, 160]) {
      await alice.page.evaluate(y => window.scrollTo(0, y), initial!.y - 112 + offset);
      await expect.poll(async () => (await sidebar.boundingBox())!.y).toBeCloseTo(112, 0);
    }
    const navigation = await alice.page.getByRole("navigation", { name: "Global", exact: true }).boundingBox();
    expect((await sidebar.boundingBox())!.y).toBeGreaterThan(navigation!.y + navigation!.height);
  } else {
    await expect(sidebar).toHaveCSS("position", "static");
    await alice.page.evaluate(() => window.scrollTo(0, 200));
    await expect.poll(async () => (await sidebar.boundingBox())!.y).toBeCloseTo(initial!.y - 200, 0);
  }
});

test("the sticky sidebar keeps chat controls reachable in short desktop windows", async ({ roomId, createPlayer, isMobile }) => {
  test.skip(isMobile, "The height cap applies only to desktop layouts.");
  const alice = await createPlayer(roomId, "Alice");
  await alice.page.setViewportSize({ width: 1104, height: 600 });
  await alice.page.evaluate(() => document.fonts.ready);
  await alice.page.evaluate(() => window.scrollTo(0, 0));
  const sidebar = alice.page.getByRole("complementary", { name: "Room sidebar", exact: true });
  const initial = await sidebar.boundingBox();
  await alice.page.evaluate(y => window.scrollTo(0, y), initial!.y - 112 + 80);
  await alice.openChat();
  await expect(sidebar).toHaveCSS("max-height", "472px");
  await expect(sidebar).toHaveCSS("overflow-y", "auto");
  expect((await sidebar.boundingBox())!.height).toBeLessThanOrEqual(472);
  await alice.page.getByRole("textbox", { name: "Your message", exact: true }).fill("The chat is still reachable");
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(alice.page.getByRole("log", { name: "Room messages", exact: true })).toContainText("The chat is still reachable");
  await expect.poll(async () => (await sidebar.boundingBox())!.y).toBeCloseTo(112, 0);
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
