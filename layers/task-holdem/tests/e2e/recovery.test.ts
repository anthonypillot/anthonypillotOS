import type { WebSocketRoute } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../server/generated/prisma/client";
import { databaseURL, routes } from "../../../../tests/e2e/configuration";
import { taskHoldemCreateSchema, taskHoldemRoomIdSchema } from "../../shared/schemas/room.schema";
import { getTaskHoldemDeck } from "../../shared/data/decks";
import { taskHoldemStateSchema } from "../../server/domain/room";
import type { TaskHoldemCreate } from "../../shared/types/room.type";
import { expect, test } from "./support/fixtures";

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Socket admission recovery is covered once.");

test("an unconfirmed creation keeps the voting scale visibly locked until a retry succeeds", async ({ page }) => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  const commands: TaskHoldemCreate[] = [];
  let roomId: string | undefined;
  await page.routeWebSocket("**/api/websocket/task-holdem/**", (route) => {
    const server = route.connectToServer();
    server.onMessage(message => route.send(message));
    route.onMessage((message) => {
      if (typeof message === "string") {
        const creation = message.match(/^42(\d+)\["room:create",(.*)\]$/);
        if (creation) {
          const command = taskHoldemCreateSchema.parse(JSON.parse(creation[2]!));
          commands.push(command);
          roomId = command.roomId;
          if (commands.length === 1) {
            route.send(`43${creation[1]}${JSON.stringify([{ ok: false, error: { code: "UNAVAILABLE", message: "Room creation is temporarily unavailable." } }])}`);
            return;
          }
        }
      }
      server.send(message);
    });
  });
  try {
    await page.goto(routes.taskHoldem);
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Creator");
    const picker = page.getByRole("combobox", { name: "Voting scale", exact: true });
    await picker.click();
    await page.getByRole("option", { name: "Linear (1–10)", exact: true }).click();
    await page.getByRole("button", { name: "Create room", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Room creation is temporarily unavailable.");
    await expect(picker).toHaveText("Linear (1–10)");
    await expect(picker).toBeDisabled();
    await expect(page.getByRole("button", { name: "Create room", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("group", { name: "Creator", exact: true })).toBeVisible();
    await expect(page.getByText("Voting scale: Linear (1–10)", { exact: true })).toBeVisible();
    expect(commands).toHaveLength(2);
    expect(commands[1]).toEqual(commands[0]);
    const room = await prisma.taskHoldemRoom.findUniqueOrThrow({ where: { id: roomId! } });
    expect(taskHoldemStateSchema.parse(room.data).round.deck).toEqual(getTaskHoldemDeck("linear"));
  } finally {
    await page.close();
    if (roomId) await prisma.taskHoldemRoom.deleteMany({ where: { id: roomId } });
    await prisma.$disconnect();
  }
});

test("a lost creation acknowledgement retries the same voting scale without duplicating the room or seat", async ({ page }) => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  const commands: TaskHoldemCreate[] = [];
  let interrupted = false;
  let roomId: string | undefined;
  await page.routeWebSocket("**/api/websocket/task-holdem/**", (route) => {
    const server = route.connectToServer();
    let acknowledgement: string | undefined;
    route.onMessage((message) => {
      if (typeof message === "string") {
        const creation = message.match(/^42(\d+)\["room:create",(.*)\]$/);
        if (creation) {
          const command = taskHoldemCreateSchema.parse(JSON.parse(creation[2]!));
          commands.push(command);
          roomId = command.roomId;
          acknowledgement = `43${creation[1]}[`;
        }
      }
      server.send(message);
    });
    server.onMessage(async (message) => {
      if (!interrupted && typeof message === "string" && acknowledgement && message.startsWith(acknowledgement)) {
        interrupted = true;
        await route.close();
        return;
      }
      route.send(message);
    });
  });
  try {
    await page.goto(routes.taskHoldem);
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Creator");
    await page.getByRole("combobox", { name: "Voting scale", exact: true }).click();
    await page.getByRole("option", { name: "Powers of 2", exact: true }).click();
    await page.getByRole("button", { name: "Create room", exact: true }).click();
    await expect(page).toHaveURL(/\?id=[a-f0-9-]+$/);
    await expect(page.getByTestId("connection-status")).toHaveText("Connected");
    await expect(page.getByRole("group", { name: "Creator", exact: true })).toHaveCount(1);
    await expect(page.getByText("Voting scale: Powers of 2", { exact: true })).toBeVisible();
    expect(interrupted).toBe(true);
    expect(commands).toHaveLength(2);
    expect(commands[0]?.votingScale).toBe("powers-of-two");
    expect(commands[1]).toEqual(commands[0]);
    const id = taskHoldemRoomIdSchema.parse(new URL(page.url()).searchParams.get("id"));
    expect(id).toBe(roomId);
    const room = await prisma.taskHoldemRoom.findUniqueOrThrow({ where: { id } });
    const state = taskHoldemStateSchema.parse(room.data);
    expect(state.round.deck).toEqual(getTaskHoldemDeck("powers-of-two"));
    expect(state.participants).toHaveLength(1);
    await page.getByRole("button", { name: "Select 64 card", exact: true }).click();
    await expect(page.getByRole("button", { name: "Select 64 card", exact: true })).toHaveAttribute("aria-pressed", "true");
  } finally {
    await page.close();
    if (roomId) await prisma.taskHoldemRoom.deleteMany({ where: { id: roomId } });
    await prisma.$disconnect();
  }
});

test("a failed rejoin keeps the credential and disables commands until admission succeeds", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await createPlayer(roomId, "Observer");
  await alice.vote(13);
  let transport: WebSocketRoute | undefined;
  let rejectJoins = false;
  let syncs = 0;
  await alice.page.routeWebSocket("**/api/websocket/task-holdem/**", (route) => {
    transport = route;
    const server = route.connectToServer();
    server.onMessage(message => route.send(message));
    route.onMessage((message) => {
      if (typeof message === "string") {
        if (message.includes('"room:sync"')) syncs++;
        const command = message.match(/^42(\d+)\["room:join",/);
        if (rejectJoins && command) {
          route.send(`43${command[1]}${JSON.stringify([{ ok: false, error: { code: "UNAVAILABLE", message: "Room admission is temporarily unavailable." } }])}`);
          return;
        }
      }
      server.send(message);
    });
  });
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  const id = await alice.player("Alice").getAttribute("data-participant-id");
  const credential = await alice.page.evaluate(id => localStorage.getItem(`task-holdem:v3:room:${id}`), roomId);
  rejectJoins = true;
  await transport!.close();
  await expect(alice.page.getByRole("alert")).toContainText("Room admission is temporarily unavailable.");
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toBeDisabled();
  const beforeFocus = syncs;
  await alice.page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await alice.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(syncs).toBe(beforeFocus);
  expect(await alice.page.evaluate(id => localStorage.getItem(`task-holdem:v3:room:${id}`), roomId)).toBe(credential);
  rejectJoins = false;
  await alice.page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(alice.player("Alice")).toHaveAttribute("data-participant-id", id!);
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toBeEnabled();
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toHaveAttribute("aria-pressed", "true");
});
