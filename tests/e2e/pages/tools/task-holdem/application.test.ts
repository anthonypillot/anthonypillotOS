import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../../server/generated/prisma/client";
import { databaseURL, routes } from "../../../configuration";
import { expect, test } from "../../../support/task-holdem";
import { taskHoldemRoomIdSchema } from "../../../../../shared/schemas/task-holdem.schema";

test("joining requires a real name and creates the chosen player avatar", async ({ page, roomId, createPlayer }) => {
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(page.getByRole("heading", { name: "TaskHold’em", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeDisabled();
  await page.getByPlaceholder("Your name", { exact: true }).fill("   ");
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeDisabled();

  const player = await createPlayer(roomId, "Alice", "girl");
  await expect(player.player("Alice").getByRole("img", { name: "poker player girl", exact: true })).toBeVisible();
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
  const alice = await createPlayer(roomId, "Alice", "girl");
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
  await page.addInitScript(() => { localStorage.setItem("task-holdem:v2:profile", "{broken"); });
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await page.getByPlaceholder("Your name", { exact: true }).fill("Alice");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await expect(page.getByRole("group", { name: "Alice", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Leave room", exact: true }).click();
});
