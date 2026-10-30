import { randomBytes, randomUUID } from "node:crypto";
import type { WebSocketRoute } from "@playwright/test";
import { io, type Socket } from "socket.io-client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../../server/generated/prisma/client";
import { baseURL, databaseURL, secondaryBaseURL } from "../../../configuration";
import { expect, test } from "../../../support/task-holdem";
import {
  connectTaskHoldemSocket, createTaskHoldemSocket, taskHoldemSuccess, type TaskHoldemTestSocket,
} from "../../../support/task-holdem-socket";
import {
  taskHoldemProtocolVersion, taskHoldemSocketPath, type TaskHoldemRoom, type TaskHoldemSnapshot, type TaskHoldemVote,
} from "../../../../../shared/types/task-holdem.type";

type SocketPlayerOptions = { roomId: string; name: string; url?: string; token?: string };

async function createSocketPlayer({ roomId, name, url = baseURL, token = randomBytes(32).toString("hex") }: SocketPlayerOptions) {
  const socket = await connectTaskHoldemSocket(url);
  try {
    const snapshot = taskHoldemSuccess(await socket.emitWithAck("room:join", { roomId, token, profile: { name, avatar: "dragon" } }));
    return { socket, snapshot, token };
  } catch (error) {
    socket.disconnect();
    throw error;
  }
}

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "The transport suite is browser-independent; run it once.");

test("an immediate join on connection is acknowledged and broadcast", async ({ roomId, createPlayer }) => {
  const observer = await createPlayer(roomId, "Observer");
  const socket = createTaskHoldemSocket(baseURL);
  try {
    const joined = new Promise<TaskHoldemSnapshot>((resolve, reject) => {
      socket.once("connect_error", reject);
      socket.once("connect", async () => {
        try {
          resolve(taskHoldemSuccess(await socket.emitWithAck("room:join", {
            roomId, token: randomBytes(32).toString("hex"), profile: { name: "Fast join", avatar: "spirit" },
          })));
        } catch (error) {
          reject(error);
        }
      });
    });
    socket.connect();
    expect((await joined).self.participantId).toBeTruthy();
    await expect(observer.player("Fast join")).toBeVisible();
    taskHoldemSuccess(await socket.emitWithAck("room:leave", {}));
  } finally {
    socket.disconnect();
  }
});

test("public broadcasts never contain unrevealed votes or credentials", async ({ roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  const alice = await createSocketPlayer({ roomId, name: "Alice" });
  const bob = await createSocketPlayer({ roomId, name: "Bob", url: secondaryBaseURL });
  const states: TaskHoldemRoom[] = [];
  bob.socket.on("room:state", state => states.push(state));
  try {
    const accepted = taskHoldemSuccess(await alice.socket.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 13 }));
    expect(accepted.self.vote).toBe(13);
    await expect.poll(() => states.some(state => state.participants.find(participant => participant.id === alice.snapshot.self.participantId)?.hasVoted)).toBe(true);
    for (const state of states) {
      expect(state.round.ballots).toBeNull();
      expect(state.round.average).toBeNull();
      expect(JSON.stringify(state)).not.toContain("tokenHash");
      expect(JSON.stringify(state)).not.toContain(alice.token);
      expect(JSON.stringify(state)).not.toContain(bob.token);
    }
    const other = taskHoldemSuccess(await bob.socket.emitWithAck("room:sync", {}));
    expect(other.self.vote).toBeNull();
    expect(taskHoldemSuccess(await bob.socket.emitWithAck("room:history", {})).items).toEqual([]);
  } finally {
    alice.socket.disconnect();
    bob.socket.disconnect();
  }
});

test("malformed commands and forged authors cannot change room state", async ({ roomId, createPlayer }) => {
  const observer = await createPlayer(roomId, "Observer");
  const alice = await createSocketPlayer({ roomId, name: "Alice" });
  const outsider = await connectTaskHoldemSocket(secondaryBaseURL);
  const unsafe = alice.socket as Socket;
  try {
    expect(await unsafe.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 999 })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await unsafe.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 8, participantId: "Observer" })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await unsafe.emitWithAck("chat:send", { content: "Forged", author: { name: "Observer" } })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await outsider.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 8 })).toMatchObject({ ok: false, error: { code: "NOT_JOINED" } });
    expect(await outsider.emitWithAck("room:history", {})).toMatchObject({ ok: false, error: { code: "NOT_JOINED" } });
    expect(await unsafe.emitWithAck("room:history", { before: -1 })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await unsafe.emitWithAck("round:topic", { roundId: alice.snapshot.room.round.id, topic: "x".repeat(161), previousTopic: null })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    unsafe.emit("room-update", { users: [], game: { status: "revealed" } });
    const snapshot = taskHoldemSuccess(await alice.socket.emitWithAck("room:sync", {}));
    expect(snapshot.room.participants).toHaveLength(2);
    expect(snapshot.room.round.phase).toBe("voting");
    expect(snapshot.self.vote).toBeNull();
    await expect(observer.player("Alice")).toHaveAttribute("data-voted", "false");
  } finally {
    alice.socket.disconnect();
    outsider.disconnect();
  }
});

test("simultaneous votes and restarts converge across two server instances", async ({ roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  const sockets: TaskHoldemTestSocket[] = [];
  const values = [1, 2, 3, 5, 8, 13, 21, 34] satisfies TaskHoldemVote[];
  try {
    const players = await Promise.all(values.map(async (_, index) => {
      const player = await createSocketPlayer({ roomId, name: `Player ${index}`, url: index % 2 ? secondaryBaseURL : baseURL });
      sockets.push(player.socket);
      return player;
    }));
    const leader = players[0]!;
    for (let round = 0; round < 3; round++) {
      const { room } = taskHoldemSuccess(await leader.socket.emitWithAck("room:sync", {}));
      taskHoldemSuccess(await leader.socket.emitWithAck("round:topic", { roundId: room.round.id, topic: `Task ${round + 1}`, previousTopic: null }));
      await Promise.all(players.map(async (player, index) => {
        taskHoldemSuccess(await player.socket.emitWithAck("round:vote", { roundId: room.round.id, value: values[index]! }));
      }));
      const accepted = taskHoldemSuccess(await leader.socket.emitWithAck("room:sync", {}));
      expect(accepted.room.participants.filter(participant => participant.hasVoted)).toHaveLength(values.length);
      taskHoldemSuccess(await leader.socket.emitWithAck("round:reveal", { roundId: room.round.id }));
      await expect.poll(async () => taskHoldemSuccess(await players[1]!.socket.emitWithAck("room:sync", {})).room.round.phase).toBe("revealed");
      const revealed = taskHoldemSuccess(await players[1]!.socket.emitWithAck("room:sync", {}));
      expect(revealed.room.round.ballots).toHaveLength(values.length);
      expect(revealed.room.round.average).toBe(10.875);
      const histories = await Promise.all(players.slice(0, 2).map(async player => taskHoldemSuccess(await player.socket.emitWithAck("room:history", {}))));
      expect(histories[0]).toEqual(histories[1]);
      expect(histories[0]?.items).toHaveLength(round + 1);
      expect(histories[0]?.items[0]).toMatchObject({ number: round + 1, topic: `Task ${round + 1}`, average: 10.875 });
      const restarted = await Promise.all(players.slice(0, 2).map(player => player.socket.emitWithAck("round:restart", { roundId: room.round.id })));
      expect(restarted.filter(result => result.ok)).toHaveLength(1);
      expect(restarted.find(result => !result.ok)).toMatchObject({ error: { code: "STALE_ROUND" } });
      const fresh = await Promise.all(players.map(async player => taskHoldemSuccess(await player.socket.emitWithAck("room:sync", {}))));
      expect(new Set(fresh.map(value => value.room.round.id)).size).toBe(1);
      expect(fresh.every(value => value.self.vote === null && value.room.round.number === round + 2)).toBe(true);
    }
  } finally {
    for (const socket of sockets) socket.disconnect();
  }
});

test("an expired old connection cannot remove a live seat on another instance", async ({ roomId, createPlayer }) => {
  const observer = await createPlayer(roomId, "Observer");
  const alice = await createSocketPlayer({ roomId, name: "Alice" });
  const second = await createSocketPlayer({ roomId, name: "Alice", token: alice.token, url: secondaryBaseURL });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  const oldConnectionId = alice.socket.id!;
  try {
    taskHoldemSuccess(await alice.socket.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 8 }));
    alice.socket.disconnect();
    await expect.poll(() => prisma.taskHoldemConnection.count({ where: { id: oldConnectionId } })).toBe(0);
    const restored = taskHoldemSuccess(await second.socket.emitWithAck("room:sync", {}));
    expect(restored.self.participantId).toBe(alice.snapshot.self.participantId);
    expect(restored.self.vote).toBe(8);
    await expect(observer.player("Alice")).toHaveCount(1);
    await expect(observer.player("Alice")).toHaveAttribute("data-connected", "true");
  } finally {
    alice.socket.disconnect();
    second.socket.disconnect();
    await prisma.$disconnect();
  }
});

test("the server completes reveal after the initiating client disconnects", async ({ roomId, createPlayer }) => {
  const observer = await createPlayer(roomId, "Observer");
  const alice = await createSocketPlayer({ roomId, name: "Alice", url: secondaryBaseURL });
  try {
    taskHoldemSuccess(await alice.socket.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 8 }));
    taskHoldemSuccess(await alice.socket.emitWithAck("round:reveal", { roundId: alice.snapshot.room.round.id }));
    alice.socket.disconnect();
    await expect(observer.page.getByText("Average: 8", { exact: true })).toBeVisible();
  } finally {
    alice.socket.disconnect();
  }
});

test("a reveal is archived even after every participant disconnects", async ({ roomId, createPlayer }) => {
  const observer = await createPlayer(roomId, "Observer");
  await observer.page.getByRole("button", { name: "Leave room", exact: true }).click();
  const alice = await createSocketPlayer({ roomId, name: "Alice", url: secondaryBaseURL });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  try {
    taskHoldemSuccess(await alice.socket.emitWithAck("round:topic", { roundId: alice.snapshot.room.round.id, topic: "Saved without a browser", previousTopic: null }));
    taskHoldemSuccess(await alice.socket.emitWithAck("round:vote", { roundId: alice.snapshot.room.round.id, value: 8 }));
    taskHoldemSuccess(await alice.socket.emitWithAck("round:reveal", { roundId: alice.snapshot.room.round.id }));
    alice.socket.disconnect();
    await expect.poll(() => prisma.taskHoldemRound.count({ where: { roomId } })).toBe(1);
    const archived = await prisma.taskHoldemRound.findFirstOrThrow({ where: { roomId } });
    expect(archived.topic).toBe("Saved without a browser");
    expect(archived.ballots).toMatchObject([{ profile: { name: "Alice" }, value: 8 }]);
  } finally {
    alice.socket.disconnect();
    await prisma.$disconnect();
  }
});

test("the browser ignores delayed snapshots and cannot restore a revoked seat", async ({ page, roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  let browserSocket: WebSocketRoute | undefined;
  let publicFrame: string | undefined;
  let privateFrame: string | undefined;
  await page.routeWebSocket("**/api/websocket/task-holdem/**", (route) => {
    browserSocket = route;
    const server = route.connectToServer();
    server.onMessage((message) => {
      if (typeof message === "string" && message.startsWith('42["room:state"')) publicFrame = message;
      if (typeof message === "string" && message.startsWith('42["room:self"')) privateFrame = message;
      route.send(message);
    });
  });
  try {
    await page.goto(`/tools/task-holdem/application?id=${roomId}`);
    await page.getByPlaceholder("Your name", { exact: true }).fill("Client");
    await page.getByRole("button", { name: "Join game", exact: true }).click();
    await expect(page.getByRole("group", { name: "Client", exact: true })).toBeVisible();
    const beforeVote = publicFrame!;
    await page.getByRole("button", { name: "Select 8 card", exact: true }).click();
    await expect(page.getByRole("button", { name: "Select 8 card", exact: true })).toHaveAttribute("aria-pressed", "true");
    const beforeLeave = { publicFrame: publicFrame!, privateFrame: privateFrame! };
    browserSocket!.send(beforeVote);
    browserSocket!.send(`42${JSON.stringify(["chat:message", { id: randomUUID(), roomId, participantId: randomUUID(), author: { name: "Checkpoint", avatar: "dragon" }, content: "Replay processed", createdAt: Date.now() }])}`);
    await page.getByRole("button", { name: "Open chat", exact: true }).click();
    await expect(page.getByRole("log", { name: "Room messages" })).toContainText("Replay processed");
    await expect(page.getByRole("group", { name: "Client", exact: true })).toHaveAttribute("data-voted", "true");
    await page.getByRole("button", { name: "Leave room", exact: true }).click();
    await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
    browserSocket!.send(beforeLeave.publicFrame);
    browserSocket!.send(beforeLeave.privateFrame);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Client", exact: true })).toBeHidden();
  } finally {
    await page.close();
  }
});

test("old protocol versions and cross-origin browser handshakes are rejected", async () => {
  for (const options of [
    { auth: { protocolVersion: 1 } },
    { auth: { protocolVersion: 2 } },
    { auth: { protocolVersion: taskHoldemProtocolVersion }, extraHeaders: { Origin: "https://unrelated.example" } },
  ]) {
    const socket = io(baseURL, { path: taskHoldemSocketPath, transports: ["websocket"], autoConnect: false, reconnection: false, ...options });
    try {
      const rejected = new Promise<Error>((resolve, reject) => {
        const timer = setTimeout(() => { reject(new Error("Handshake was not rejected")); }, 5000);
        socket.once("connect_error", (error) => { clearTimeout(timer); resolve(error); });
        socket.once("connect", () => { clearTimeout(timer); reject(new Error("Unexpectedly accepted an invalid handshake")); });
      });
      socket.connect();
      expect((await rejected).message).toBeTruthy();
      expect(socket.connected).toBe(false);
    } finally {
      socket.disconnect();
    }
  }
});

test("topic edits conflict atomically across instances and stale edits cannot change a fresh round", async ({ roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  const alice = await createSocketPlayer({ roomId, name: "Alice" });
  const bob = await createSocketPlayer({ roomId, name: "Bob", url: secondaryBaseURL });
  const roundId = alice.snapshot.room.round.id;
  try {
    const updates = await Promise.all([alice, bob].map(player => player.socket.emitWithAck("round:topic", { roundId, topic: player.snapshot.self.participantId, previousTopic: null })));
    expect(updates.filter(result => result.ok)).toHaveLength(1);
    expect(updates.find(result => !result.ok)).toMatchObject({ error: { code: "TOPIC_CHANGED" } });
    taskHoldemSuccess(await alice.socket.emitWithAck("round:vote", { roundId, value: 5 }));
    taskHoldemSuccess(await alice.socket.emitWithAck("round:reveal", { roundId }));
    await expect.poll(async () => taskHoldemSuccess(await bob.socket.emitWithAck("room:sync", {})).room.round.phase).toBe("revealed");
    taskHoldemSuccess(await bob.socket.emitWithAck("round:restart", { roundId }));
    expect(await alice.socket.emitWithAck("round:topic", { roundId, topic: "Stale", previousTopic: null })).toMatchObject({ ok: false, error: { code: "STALE_ROUND" } });
    expect(taskHoldemSuccess(await alice.socket.emitWithAck("room:sync", {})).room.round.topic).toBeNull();
  } finally {
    alice.socket.disconnect();
    bob.socket.disconnect();
  }
});

test("history pagination is ordered, bounded and isolated to the joined room", async ({ roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  const otherRoomId = randomUUID();
  await createPlayer(otherRoomId, "Outsider");
  const alice = await createSocketPlayer({ roomId, name: "Alice" });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  try {
    await prisma.taskHoldemRound.create({ data: {
      id: randomUUID(), roomId: otherRoomId, number: 999, topic: "Another room's private history",
      startedAt: new Date(1000), revealedAt: new Date(2000), ballots: [],
    } });
    await prisma.taskHoldemRound.createMany({
      data: Array.from({ length: 23 }, (_, index) => ({
        id: randomUUID(), roomId, number: index + 1, topic: `Archived task ${index + 1}`,
        startedAt: new Date(1000 + index * 1000), revealedAt: new Date(1500 + index * 1000), ballots: [],
      })),
    });
    const first = taskHoldemSuccess(await alice.socket.emitWithAck("room:history", {}));
    expect(first.items).toHaveLength(20);
    expect(first.items[0]?.number).toBe(23);
    expect(JSON.stringify(first)).not.toContain("private history");
    expect(first.nextBefore).toBe(4);
    const second = taskHoldemSuccess(await alice.socket.emitWithAck("room:history", { before: first.nextBefore! }));
    expect(second.items.map(entry => entry.number)).toEqual([3, 2, 1]);
    expect(second.nextBefore).toBeNull();
    expect(new Set([...first.items, ...second.items].map(entry => entry.id)).size).toBe(23);
  } finally {
    alice.socket.disconnect();
    await prisma.$disconnect();
  }
});
