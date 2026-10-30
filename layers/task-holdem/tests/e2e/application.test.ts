import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../server/generated/prisma/client";
import { databaseURL, routes } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/task-holdem";
import { taskHoldemRoomIdSchema } from "../../shared/schemas/task-holdem.schema";

test("joining requires a real name and creates the chosen player avatar", async ({ page, roomId, createPlayer }) => {
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(page.getByRole("heading", { name: "TaskHold’em", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeDisabled();
  await page.getByPlaceholder("Your name", { exact: true }).fill("   ");
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeDisabled();

  await expect(page.getByRole("radio")).toHaveCount(6);
  const player = await createPlayer(roomId, "Alice", "spirit");
  await expect(player.player("Alice").getByRole("img", { name: "Violet Spirit", exact: true })).toBeVisible();
  await expect(player.reveal).toBeDisabled();
  await expect(player.page).toHaveURL(new RegExp(`id=${roomId}$`));
  expect(await player.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("creating a room produces a shareable invitation and joins its creator", async ({ page }) => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  let roomId: string | undefined;
  try {
    await page.goto(routes.taskHoldem);
    await page.getByPlaceholder("Your name", { exact: true }).fill("Creator");
    await page.getByRole("button", { name: "Create room", exact: true }).click();
    await expect(page.getByRole("group", { name: "Creator", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\?id=[a-f0-9-]+$/);
    roomId = taskHoldemRoomIdSchema.parse(new URL(page.url()).searchParams.get("id"));
    await expect(page.getByRole("button", { name: "Invite players", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Leave room", exact: true }).click();
    await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
  } finally {
    await page.close();
    if (roomId) await prisma.taskHoldemRoom.deleteMany({ where: { id: roomId } });
    await prisma.$disconnect();
  }
});

test("players synchronize votes, results and a fresh round", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "spirit");
  const bob = await createPlayer(roomId, "Bob");
  await expect(alice.player("Bob")).toBeVisible();
  await expect(bob.player("Alice")).toBeVisible();
  await expect(alice.reveal).toBeDisabled();

  await alice.vote(8);
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await bob.vote(21);
  await expect(alice.player("Bob")).toHaveAttribute("data-voted", "true");
  await alice.reveal.click();

  for (const player of [alice, bob]) {
    await expect(player.page.getByText("Result", { exact: true })).toBeVisible();
    await expect(player.page.getByText("Average: 14.5", { exact: true })).toBeVisible();
    await expect(player.player("Alice")).toContainText("8");
    await expect(player.player("Bob")).toContainText("21");
    await expect(player.page.getByRole("button", { name: "Select 13 card", exact: true })).toBeDisabled();
  }

  await bob.restart.click();
  for (const player of [alice, bob]) {
    await expect(player.reveal).toBeDisabled();
    await expect(player.player("Alice")).toHaveAttribute("data-voted", "false");
    await expect(player.player("Bob")).toHaveAttribute("data-voted", "false");
    await expect(player.page.getByRole("button", { pressed: true })).toHaveCount(0);
    await expect(player.page.getByText("Result", { exact: true })).toBeHidden();
    await expect(player.page.getByRole("heading", { name: "Round 2", exact: true })).toBeVisible();
  }
});

test("cards support keyboard voting and selecting the same card clears the vote", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.page.getByRole("button", { name: "Select 8 card", exact: true }).focus();
  await alice.page.keyboard.press("Space");
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await alice.page.getByRole("button", { name: "Select 8 card", exact: true }).click();
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "false");
  await expect(alice.page.getByRole("button", { name: "Select 8 card", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(bob.reveal).toBeDisabled();
});

test("non-numeric votes do not distort the average", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await expect(alice.player("Bob")).toBeVisible();
  await alice.vote(8);
  await bob.vote("skip");
  await expect(alice.player("Bob")).toHaveAttribute("data-voted", "true");
  await alice.reveal.click();
  await expect(alice.page.getByText("Average: 8", { exact: true })).toBeVisible();
  await expect(bob.page.getByText("Average: 8", { exact: true })).toBeVisible();
});

test("leaving is immediate while disconnection keeps a seat briefly", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await expect(alice.player("Bob")).toBeVisible();
  await bob.page.getByRole("button", { name: "Leave room", exact: true }).click();
  await expect(bob.page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
  await expect(alice.player("Bob")).toBeHidden();

  const charlie = await createPlayer(roomId, "Charlie");
  await expect(alice.player("Charlie")).toBeVisible();
  await charlie.page.close();
  await expect(alice.player("Charlie")).toHaveAttribute("data-connected", "false");
  await expect(alice.player("Charlie")).toBeHidden();
});

test("reloading restores the same seat and selected vote", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.vote(13);
  const participantId = await alice.player("Alice").getAttribute("data-participant-id");
  await alice.page.reload();
  await expect(alice.player("Alice")).toHaveAttribute("data-participant-id", participantId!);
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await expect(bob.player("Alice")).toHaveCount(1);
});

test("SPA navigation releases the connection and allows restoring the room", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await expect(bob.player("Alice")).toBeVisible();
  await alice.page.getByRole("link", { name: "anthonypillotOS home", exact: true }).click();
  await expect(bob.player("Alice")).toHaveAttribute("data-connected", "false");
  await alice.page.goBack();
  await expect(alice.player("Alice")).toBeVisible();
  await expect(bob.player("Alice")).toHaveAttribute("data-connected", "true");
  await expect(bob.player("Alice")).toHaveCount(1);
});

test("chat messages stay in their room and clear the draft after confirmation", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const outsider = await createPlayer(randomUUID(), "Charlie");
  await expect(alice.player("Bob")).toBeVisible();
  await expect(outsider.player("Alice")).toBeHidden();
  for (const player of [alice, bob, outsider]) await player.openChat();
  await expect(alice.page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await alice.page.getByPlaceholder("Your message", { exact: true }).fill("Ready for the next task?");
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  for (const player of [alice, bob]) {
    await expect(player.page.getByRole("log", { name: "Room messages" })).toContainText("Ready for the next task?");
    await expect(player.page.getByRole("log", { name: "Room messages" })).toContainText("Alice:");
  }
  await expect(alice.page.getByPlaceholder("Your message", { exact: true })).toBeEmpty();
  await expect(outsider.page.getByRole("log", { name: "Room messages" })).not.toContainText("Ready for the next task?");
});

test("invalid and nonexistent invitations cannot silently create rooms", async ({ page }) => {
  await page.goto(`${routes.taskHoldem}?id=invalid`);
  await expect(page.getByRole("alert")).toContainText("invitation link is invalid");
  await page.getByPlaceholder("Your name", { exact: true }).fill("Alice");
  await expect(page.getByRole("button", { name: "Create room", exact: true })).toBeDisabled();
  await page.goto(`${routes.taskHoldem}?id=${randomUUID()}`);
  await expect(page.getByRole("alert")).toContainText("room is unavailable");
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeDisabled();
});

test("corrupt remembered profiles do not prevent joining", async ({ page, roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  await page.addInitScript(() => { localStorage.setItem("task-holdem:v3:profile", "{broken"); });
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await page.getByPlaceholder("Your name", { exact: true }).fill("Alice");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await expect(page.getByRole("group", { name: "Alice", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Leave room", exact: true }).click();
});

test("shared topics are locked at reveal and saved with timestamped results", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "phoenix");
  const bob = await createPlayer(roomId, "Bob", "golem");
  await alice.page.getByRole("button", { name: "Add topic", exact: true }).click();
  await alice.page.getByRole("textbox", { name: "Round topic", exact: true }).fill("PROJ-42 · Improve sign-in");
  await alice.page.getByRole("button", { name: "Save topic", exact: true }).click();
  await expect(bob.page.getByText("PROJ-42 · Improve sign-in", { exact: true })).toBeVisible();
  await alice.vote(8);
  await bob.vote(13);
  await alice.reveal.click();
  await expect(alice.page.getByRole("button", { name: "Edit topic", exact: true })).toBeHidden();
  await expect(bob.page.getByText("Average: 10.5", { exact: true })).toBeVisible();
  await bob.page.getByRole("button", { name: /^History/ }).click();
  const history = bob.page.getByRole("dialog", { name: "Session history", exact: true });
  await expect(history.getByText("PROJ-42 · Improve sign-in", { exact: true })).toBeVisible();
  await expect(history.locator("time")).toHaveCount(2);
  for (const time of await history.locator("time").all()) expect(Date.parse((await time.getAttribute("datetime"))!)).toBeGreaterThan(0);
  await history.getByText("2 votes · View details", { exact: true }).click();
  await expect(history.getByRole("list", { name: "Round 1 votes" })).toContainText("Alice");
  await expect(history.getByRole("list", { name: "Round 1 votes" })).toContainText("Bob");
  await bob.page.keyboard.press("Escape");
  await bob.restart.click();
  await expect(alice.page.getByText("What are we estimating?", { exact: true })).toBeVisible();
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  await alice.page.getByRole("button", { name: /^History/ }).click();
  await expect(alice.page.getByRole("dialog").getByText("PROJ-42 · Improve sign-in", { exact: true })).toBeVisible();
});

test("concurrent topic drafts are preserved instead of being silently replaced", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  for (const player of [alice, bob]) await player.page.getByRole("button", { name: "Add topic", exact: true }).click();
  await bob.page.getByRole("textbox", { name: "Round topic", exact: true }).fill("Bob's draft");
  await alice.page.getByRole("textbox", { name: "Round topic", exact: true }).fill("Alice's topic");
  await alice.page.getByRole("button", { name: "Save topic", exact: true }).click();
  await expect(bob.page.getByText(/A teammate updated the topic/)).toBeVisible();
  await expect(bob.page.getByRole("textbox", { name: "Round topic", exact: true })).toHaveValue("Bob's draft");
  await alice.vote(8);
  await expect(bob.page.getByRole("textbox", { name: "Round topic", exact: true })).toHaveValue("Bob's draft");
  await bob.page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(bob.page.getByText("Alice's topic", { exact: true })).toBeVisible();
});

test("history handles empty sessions and rounds without a topic", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "mushroom");
  await alice.page.getByRole("button", { name: /^History/ }).click();
  await expect(alice.page.getByRole("dialog").getByText("Your session story starts here.", { exact: true })).toBeVisible();
  await alice.page.keyboard.press("Escape");
  await alice.vote("skip");
  await alice.reveal.click();
  await expect(alice.page.getByText("Average: N/A", { exact: true })).toBeVisible();
  await alice.page.getByRole("button", { name: /^History/ }).click();
  const history = alice.page.getByRole("dialog");
  await expect(history.getByText("Untitled round", { exact: true })).toBeVisible();
  await history.getByText("1 vote · View details", { exact: true }).click();
  await expect(history.getByRole("list", { name: "Round 1 votes" })).toContainText("Pass");
});

test("pixel companions respect reduced motion and remember the chosen creature", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "slime");
  const companion = alice.player("Alice").getByRole("img", { name: "Azure Slime", exact: true });
  await expect(companion).toBeVisible();
  expect(await companion.locator(".mascot-idle").evaluate(node => getComputedStyle(node).animationName)).toBe("none");
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await companion.locator(".mascot-idle").evaluate(node => getComputedStyle(node).animationName)).not.toBe("none");
  await alice.page.reload();
  await expect(alice.player("Alice").getByRole("img", { name: "Azure Slime", exact: true })).toBeVisible();
});
