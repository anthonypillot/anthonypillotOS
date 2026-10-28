import { randomUUID } from "node:crypto";
import { io } from "socket.io-client";
import { routes } from "../../../configuration";
import { expect, test } from "../../../support/task-holdem";

test("joining requires a name and creates the chosen player avatar", async ({ page, roomId, createPlayer }) => {
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(page.getByRole("heading", { name: "TaskHold’em", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeDisabled();

  const player = await createPlayer(roomId, "Alice", "girl");
  await expect(player.player("Alice").getByRole("img", { name: "poker player girl", exact: true })).toBeVisible();
  await expect(player.reveal).toBeDisabled();
  await expect(player.page).toHaveURL(new RegExp(`id=${roomId}$`));
});

test("players synchronize votes, results and a fresh round", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "girl");
  const bob = await createPlayer(roomId, "Bob");
  await expect(alice.player("Bob")).toBeVisible();
  await expect(bob.player("Alice")).toBeVisible();
  await expect(alice.reveal).toBeDisabled();
  await expect(bob.reveal).toBeDisabled();

  await alice.vote(8);
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await bob.vote(21);
  await expect(alice.player("Bob")).toHaveAttribute("data-voted", "true");
  await expect(alice.reveal).toBeEnabled();
  await expect(bob.reveal).toBeEnabled();
  await alice.reveal.click();

  for (const player of [alice, bob]) {
    await expect(player.page.getByText("Result", { exact: true })).toBeVisible();
    await expect(player.page.getByText("Average: 14.5", { exact: true })).toBeVisible();
    await expect(player.player("Alice")).toContainText("8");
    await expect(player.player("Bob")).toContainText("21");
  }

  await bob.restart.click();
  for (const player of [alice, bob]) {
    await expect(player.reveal).toBeDisabled();
    await expect(player.player("Alice")).toHaveAttribute("data-voted", "false");
    await expect(player.player("Bob")).toHaveAttribute("data-voted", "false");
    await expect(player.page.getByRole("button", { pressed: true })).toHaveCount(0);
    await expect(player.page.getByText("Result", { exact: true })).toBeHidden();
  }
});

test("an immediate socket join is not lost during room initialization", async ({ baseURL, roomId, createPlayer, diagnostics }) => {
  const observer = await createPlayer(roomId, "Observer");
  const socket = io(baseURL, {
    path: "/api/websocket/task-holdem",
    transports: ["websocket"],
    query: { id: roomId, sessionId: randomUUID() },
    autoConnect: false,
    reconnection: false,
  });
  socket.on("connect_error", error => diagnostics.push(`Immediate join connection error: ${error.message}`));
  socket.on("connect", () => socket.emit("user-create", {
    id: randomUUID(), sessionId: null, name: "Fast join", avatar: "girl", selectedCard: null,
  }));

  try {
    socket.connect();
    await expect(observer.player("Fast join")).toBeVisible();
  } finally {
    socket.disconnect();
    await expect(observer.player("Fast join")).toBeHidden();
  }
});

test("non-numeric votes do not distort the average", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await expect(alice.player("Bob")).toBeVisible();
  await alice.vote(8);
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await bob.vote("skip");
  await expect(alice.player("Bob")).toHaveAttribute("data-voted", "true");
  await alice.reveal.click();
  await expect(alice.page.getByText("Average: 8", { exact: true })).toBeVisible();
  await expect(bob.page.getByText("Average: 8", { exact: true })).toBeVisible();
});

test("removal and disconnection remove the actual player from the other screen", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await expect(alice.player("Bob")).toBeVisible();
  await bob.page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(bob.page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
  await expect(alice.player("Bob")).toBeHidden();

  const charlie = await createPlayer(roomId, "Charlie");
  await expect(alice.player("Charlie")).toBeVisible();
  await charlie.page.close();
  await expect(alice.player("Charlie")).toBeHidden();
});

test("chat messages are delivered to room members but not another room", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const outsider = await createPlayer(randomUUID(), "Charlie");
  await expect(alice.player("Bob")).toBeVisible();
  await expect(outsider.player("Alice")).toBeHidden();
  await expect(alice.player("Charlie")).toBeHidden();

  for (const player of [alice, bob, outsider]) await player.openChat();
  await expect(alice.page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await alice.page.getByPlaceholder("Your message", { exact: true }).fill("Ready for the next task?");
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();

  for (const player of [alice, bob]) {
    await expect(player.page.getByRole("log", { name: "Room messages" })).toContainText("Alice:Ready for the next task?");
  }
  await expect(alice.page.getByPlaceholder("Your message", { exact: true })).toBeEmpty();
  await expect(outsider.page.getByText("No messages yet", { exact: true })).toBeVisible();
  await expect(outsider.page.getByRole("log", { name: "Room messages" })).toHaveCount(0);
});
