import { routes } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/task-holdem";

test("admission removes the extra badge and explains that accounts are not required", async ({ page, roomId }) => {
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(page.getByText("Made for your next planning session", { exact: true })).toHaveCount(0);
  const teamwork = page.getByText("Real-time teamwork", { exact: true });
  const account = page.getByText("No account needed", { exact: true });
  await expect(account).toHaveCount(1);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(teamwork).toBeVisible();
    await expect(account).toBeVisible();
    const teamworkBounds = await teamwork.boundingBox();
    const accountBounds = await account.boundingBox();
    expect(accountBounds!.x).toBeGreaterThanOrEqual(teamworkBounds!.x + teamworkBounds!.width);
  }
});

test("all card suits use traditional ink colors and the selected marker is white", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  for (const suit of ["clubs", "spades", "diamonds", "hearts"]) {
    const symbols = alice.page.locator(`[data-suit="${suit}"]`);
    expect(await symbols.count()).toBeGreaterThan(0);
    for (const symbol of await symbols.all()) {
      await expect(symbol).toHaveCSS("color", suit === "diamonds" || suit === "hearts" ? "rgb(220, 38, 38)" : "rgb(0, 0, 0)");
      await expect(symbol).toHaveCSS("background-color", "rgb(255, 255, 255)");
    }
  }
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
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
