import { routes } from "../../../../tests/e2e/support/configuration";
import { taskHoldemMascots } from "../../shared/data/mascots";
import { expect, test } from "./support/fixtures";

test.skip(({ hasTouch }) => !hasTouch, "These scenarios exercise touch devices, not desktop pointer interactions.");

test("an expanded chat below the touch viewport keeps incoming messages unread", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.openChat();
  const log = alice.page.getByRole("log", { name: "Room messages", exact: true });
  await log.scrollIntoViewIfNeeded();
  await alice.page.evaluate(() => window.scrollTo(0, 0));
  await expect(log).not.toBeInViewport();
  await bob.openChat();
  await bob.page.getByRole("textbox", { name: "Your message", exact: true }).fill("Read this when you return to the chat");
  await bob.page.getByRole("button", { name: "Send", exact: true }).tap();
  await alice.page.bringToFront();
  await expect(alice.page.getByTestId("chat-message-count")).toContainText("1 unread message");
  await log.scrollIntoViewIfNeeded();
  await expect(alice.page.getByTestId("chat-message-count")).toHaveCount(0);
});

test("a player-list avatar responds to touch while its card companion is offscreen", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "robot");
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  await alice.vote(8);
  const sidebar = alice.page.getByRole("complementary", { name: "Room sidebar", exact: true });
  await sidebar.evaluate((element) => { element.scrollIntoView({ block: "start" }); window.scrollBy(0, -112); });
  const companion = alice.page.getByTestId("card-companion");
  await expect(companion).not.toBeInViewport();
  const hello = alice.player("Alice").getByRole("button", { name: "Say hello to Alice", exact: true });
  const bounds = (await hello.boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await expect(hello.locator("[data-mascot]")).toHaveAttribute("data-running", "true");
  await hello.tap();
  await expect(hello.locator("[data-mascot]")).toHaveAttribute("data-motion", "moonwalk");
  await expect(companion.locator("[data-mascot]")).toHaveAttribute("data-running", "false");
  await expect(companion.locator("[data-mascot]")).toHaveAttribute("data-motion", "rest");
  await expect(alice.page.getByRole("button", { name: "Select 8 card", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("the companion's touch target triggers its secret without changing the selected vote", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "robot");
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  await alice.vote(8);
  const hello = alice.page.getByRole("button", { name: "Say hello to your Robot", exact: true });
  await hello.scrollIntoViewIfNeeded();
  const bounds = (await hello.boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await expect(hello.locator("[data-mascot]")).toHaveAttribute("data-running", "true");
  await hello.tap();
  await expect(hello.locator("[data-mascot]")).toHaveAttribute("data-motion", "moonwalk");
  await expect(alice.page.getByRole("button", { name: "Select 8 card", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(alice.page.getByTestId("vote-card-grid").getByRole("button", { pressed: true })).toHaveCount(1);
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("finger-sized character targets respond to taps and join with the chosen avatar", async ({ page, roomId, createPlayer }) => {
  const observer = await createPlayer(roomId, "Observer");
  try {
    await page.goto(`${routes.taskHoldem}?id=${roomId}`);
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Alice");
    const picker = page.getByRole("group", { name: "Choose your character", exact: true });
    for (const character of Object.values(taskHoldemMascots)) {
      const option = picker.getByRole("radio", { name: character.name, exact: true });
      const bounds = (await option.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      await option.tap({ position: { x: 8, y: 8 } });
      await expect(option).toBeChecked();
      await expect(picker.getByRole("radio", { checked: true })).toHaveCount(1);
      await expect(page.getByText(character.description, { exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Join game", exact: true }).tap();
    await expect(page.getByRole("group", { name: "Alice", exact: true }).getByRole("img", { name: "Robot", exact: true })).toBeVisible();
    await expect(observer.player("Alice").getByRole("img", { name: "Robot", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  } finally {
    await page.close();
  }
});

test("the narrow touch deck exposes offscreen cards without scrolling the page sideways", async ({ roomId, createPlayer, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 640, "Only phone layouts use a horizontally scrollable deck.");
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const grid = alice.page.getByTestId("vote-card-grid");
  const last = grid.getByRole("button", { name: "Select break card", exact: true });
  await grid.scrollIntoViewIfNeeded();
  expect(await grid.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await expect(last).not.toBeInViewport();
  await grid.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  await expect.poll(() => grid.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await expect(last).toBeInViewport();
  await last.tap();
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await expect(bob.player("Alice")).not.toContainText("Unsure");
  await last.tap();
  await expect(last).toHaveAttribute("aria-pressed", "false");
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "false");
  const highVote = grid.getByRole("button", { name: "Select 89 card", exact: true });
  await highVote.tap();
  await expect(highVote).toHaveAttribute("aria-pressed", "true");
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await expect(bob.player("Alice")).not.toContainText("89");
  await grid.evaluate((element) => { element.scrollLeft = 0; });
  const first = grid.getByRole("button", { name: "Select 1 card", exact: true });
  await expect(first).toBeInViewport();
  await first.tap();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(highVote).toHaveAttribute("aria-pressed", "false");
  expect(await alice.page.evaluate(() => window.scrollX)).toBe(0);
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("tablet portrait and landscape layouts keep the seat, vote and drafts while chat stays touchable", async ({ roomId, createPlayer, viewport }) => {
  test.skip((viewport?.width ?? 0) < 640, "This scenario exercises the tablet layout changing across the sidebar breakpoint.");
  const alice = await createPlayer(roomId, "Alice", "princess");
  const bob = await createPlayer(roomId, "Bob");
  const participantId = await alice.player("Alice").getAttribute("data-participant-id");
  const vote = alice.page.getByRole("button", { name: "Select 8 card", exact: true });
  await vote.tap();
  await expect(vote).toHaveAttribute("aria-pressed", "true");
  const topic = alice.page.getByRole("textbox", { name: "Round topic", exact: true });
  await topic.fill("A topic draft kept across tablet layouts");
  await alice.page.getByRole("button", { name: "Open chat", exact: true }).tap();
  const message = alice.page.getByRole("textbox", { name: "Your message", exact: true });
  await message.fill("Ready after rotating the tablet");
  const portrait = viewport!;
  const landscape = { width: portrait.height, height: portrait.width };
  for (const size of [landscape, portrait]) {
    await alice.page.setViewportSize(size);
    await expect(alice.page.getByRole("complementary", { name: "Room sidebar", exact: true })).toHaveCSS("position", size.width >= 1024 ? "sticky" : "static");
    await expect(alice.player("Alice")).toHaveAttribute("data-participant-id", participantId!);
    await expect(alice.player("Alice")).toHaveAttribute("data-connected", "true");
    await expect(vote).toHaveAttribute("aria-pressed", "true");
    await expect(topic).toHaveValue("A topic draft kept across tablet layouts");
    await expect(message).toHaveValue("Ready after rotating the tablet");
    await message.tap();
    await expect(message).toBeFocused();
    expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
  await alice.page.getByRole("button", { name: "Send", exact: true }).tap();
  await expect(message).toBeEmpty();
  await bob.page.getByRole("button", { name: "Open chat", exact: true }).tap();
  await expect(bob.page.getByRole("log", { name: "Room messages", exact: true })).toContainText("Ready after rotating the tablet");
  await expect(bob.page.getByRole("textbox", { name: "Round topic", exact: true })).toBeEmpty();
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
});
