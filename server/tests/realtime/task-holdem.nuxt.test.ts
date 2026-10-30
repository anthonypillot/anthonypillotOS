import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { Adapter, type BroadcastOptions, type Room } from "socket.io-adapter";
import { io as connect, type Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as service from "#server/services/task-holdem.service";
import { registerTaskHoldemGateway, type TaskHoldemServer } from "#server/realtime/task-holdem";
import { TaskHoldemError, createTaskHoldemState, selectTaskHoldemVote, type TaskHoldemActor, type TaskHoldemUpdate } from "#server/domain/task-holdem/room";
import { taskHoldemConfig } from "#server/utils/task-holdem-config";
import { taskHoldemProtocolVersion, taskHoldemSocketPath, type TaskHoldemClientEvents, type TaskHoldemServerEvents, type TaskHoldemResult, type TaskHoldemSelf } from "#shared/types/task-holdem.type";

vi.mock("#server/services/task-holdem.service", () => ({
  inspectRoom: vi.fn(), createRoom: vi.fn(), joinRoom: vi.fn(), getJoinedParticipant: vi.fn(),
  syncRoom: vi.fn(), leaveRoom: vi.fn(), selectVote: vi.fn(), revealRound: vi.fn(), restartRound: vi.fn(),
  setTopic: vi.fn(), getHistory: vi.fn(), createMessage: vi.fn(), disconnect: vi.fn(), heartbeat: vi.fn(),
  findDueRooms: vi.fn(), reconcileRoom: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

class ControlledAdapter extends Adapter {
  delayEviction = false;
  evictions: (() => void)[] = [];
  pauseJoinId: string | undefined;
  joinEntered = deferred<undefined>();
  resumeJoin = deferred<undefined>();

  override broadcast(packet: Parameters<Adapter["broadcast"]>[0], options: BroadcastOptions): void {
    if (this.delayEviction && packet.data?.[0] === "room:left") {
      this.evictions.push(() => super.broadcast(packet, options));
      return;
    }
    super.broadcast(packet, options);
  }

  override delSockets(options: BroadcastOptions, rooms: Room[]): void {
    if (this.delayEviction) { this.evictions.push(() => super.delSockets(options, rooms)); return; }
    super.delSockets(options, rooms);
  }

  override async addAll(id: string, rooms: Set<Room>): Promise<void> {
    if (id === this.pauseJoinId && [...rooms].some(room => room.startsWith("task-holdem:member:"))) {
      this.joinEntered.resolve(undefined);
      await this.resumeJoin.promise;
    }
    await super.addAll(id, rooms);
  }

  flushEvictions(): void {
    this.delayEviction = false;
    this.evictions.splice(0).forEach(evict => evict());
  }
}

type Client = Socket<TaskHoldemServerEvents, TaskHoldemClientEvents>;
let io: TaskHoldemServer;
let gateway: ReturnType<typeof registerTaskHoldemGateway>;
let adapter: ControlledAdapter;
let url: string;
let state: ReturnType<typeof createTaskHoldemState>;
let revision: number;
const clients: Client[] = [];
const actors = new Map<string, TaskHoldemActor>();
const firstToken = "a".repeat(64);
const secondToken = "b".repeat(64);
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

function update(changed = false, removedParticipantIds: string[] = []): TaskHoldemUpdate {
  if (changed) revision++;
  return { state: structuredClone(state), revision, changed, removedParticipantIds };
}

function validate(actor: TaskHoldemActor): void {
  if (actors.get(actor.connectionId)?.participantId !== actor.participantId) throw new TaskHoldemError("NOT_JOINED", "The seat expired.");
}

function success<T>(result: TaskHoldemResult<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

async function openClient(): Promise<Client> {
  const client: Client = connect(url, { path: taskHoldemSocketPath, auth: { protocolVersion: taskHoldemProtocolVersion }, transports: ["websocket"], autoConnect: false, reconnection: false, ackTimeout: 2000 });
  clients.push(client);
  await new Promise<void>((resolve, reject) => { client.once("connect", resolve); client.once("connect_error", reject); client.connect(); });
  return client;
}

async function join(client: Client, token = firstToken) {
  return success(await client.emitWithAck("room:join", { roomId: state.id, token, profile: { name: token === firstToken ? "Alice" : "Bob", avatar: "dragon" } }));
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  vi.clearAllMocks();
  actors.clear();
  state = createTaskHoldemState(randomUUID());
  revision = 0;
  vi.mocked(service.joinRoom).mockImplementation(async (command, connectionId) => {
    let member = state.participants.find(participant => participant.tokenHash === hash(command.token));
    if (!member) {
      member = { id: randomUUID(), tokenHash: hash(command.token), connected: true, profile: command.profile };
      state.participants.push(member);
    }
    actors.set(connectionId, { roomId: state.id, participantId: member.id, connectionId });
    return update(true);
  });
  vi.mocked(service.getJoinedParticipant).mockImplementation((value, token) => value.state.participants.find(member => member.tokenHash === hash(token))!.id);
  vi.mocked(service.syncRoom).mockImplementation(async (actor) => { validate(actor); return update(); });
  vi.mocked(service.heartbeat).mockImplementation(async (actor) => { validate(actor); return update(); });
  vi.mocked(service.leaveRoom).mockImplementation(async (actor) => {
    validate(actor);
    state.participants = state.participants.filter(member => member.id !== actor.participantId);
    for (const [id, current] of actors) if (current.participantId === actor.participantId) actors.delete(id);
    return update(true, [actor.participantId]);
  });
  vi.mocked(service.selectVote).mockImplementation(async (actor, selection) => {
    validate(actor);
    selectTaskHoldemVote(state, state.participants.find(member => member.id === actor.participantId)!, selection);
    return update(true);
  });
  vi.mocked(service.disconnect).mockImplementation(async () => update());
  vi.mocked(service.findDueRooms).mockResolvedValue([]);
  const http = createServer();
  io = new Server(http, { path: taskHoldemSocketPath, adapter: ControlledAdapter });
  const configured = io.of("/").adapter;
  if (!(configured instanceof ControlledAdapter)) throw new Error("Unexpected test adapter");
  adapter = configured;
  gateway = registerTaskHoldemGateway(io);
  await new Promise<void>(resolve => http.listen(0, "127.0.0.1", resolve));
  const address = http.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  url = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  adapter.resumeJoin.resolve(undefined);
  adapter.flushEvictions();
  clients.splice(0).forEach(client => client.disconnect());
  await gateway.close();
  vi.useRealTimers();
});

describe("Task Hold'em membership subscriptions", () => {
  test("an expired connection cannot retain another participant's private vote channel", async () => {
    const first = await openClient();
    const original = await join(first);
    const second = await openClient();
    await join(second);
    actors.delete(first.id!);
    await vi.advanceTimersByTimeAsync(taskHoldemConfig.heartbeatMs);
    const views: TaskHoldemSelf[] = [];
    first.on("room:self", view => views.push(view));
    const fresh = await join(first, secondToken);
    success(await second.emitWithAck("round:vote", { roundId: state.round.id, value: 13 }));
    success(await first.emitWithAck("room:sync", {}));
    expect(fresh.self.participantId).not.toBe(original.self.participantId);
    expect(views).toContainEqual(expect.objectContaining({ participantId: fresh.self.participantId }));
    expect(views.some(view => view.participantId === original.self.participantId)).toBe(false);
  });

  test("delayed cluster eviction cannot revoke a socket that has left and rejoined", async () => {
    const client = await openClient();
    await join(client);
    adapter.delayEviction = true;
    success(await client.emitWithAck("room:leave", {}));
    const fresh = await join(client, secondToken);
    adapter.flushEvictions();
    success(await client.emitWithAck("room:sync", {}));
    const serverSocket = io.sockets.sockets.get(client.id!)!;
    expect(serverSocket.rooms.has(`task-holdem:room:${state.id}`)).toBe(true);
    expect(serverSocket.data.actor?.participantId).toBe(fresh.self.participantId);
  });

  test("a join revoked between persistence and subscription is rejected and unsubscribed", async () => {
    const first = await openClient();
    await join(first);
    const pending = await openClient();
    adapter.pauseJoinId = pending.id;
    const admission = pending.emitWithAck("room:join", { roomId: state.id, token: firstToken, profile: { name: "Alice", avatar: "dragon" } });
    await adapter.joinEntered.promise;
    success(await first.emitWithAck("room:leave", {}));
    adapter.resumeJoin.resolve(undefined);
    expect(await admission).toMatchObject({ ok: false, error: { code: "NOT_JOINED" } });
    expect([...io.sockets.sockets.get(pending.id!)!.rooms].some(room => room.startsWith("task-holdem:"))).toBe(false);
  });

  test("a delayed heartbeat failure cannot clear a newly joined actor", async () => {
    const client = await openClient();
    await join(client);
    const entered = deferred<undefined>();
    const heartbeat = deferred<TaskHoldemUpdate>();
    vi.mocked(service.heartbeat).mockImplementationOnce(async () => { entered.resolve(undefined); return heartbeat.promise; });
    const timer = vi.advanceTimersByTimeAsync(taskHoldemConfig.heartbeatMs);
    await entered.promise;
    try {
      success(await client.emitWithAck("room:leave", {}));
      const fresh = await join(client, secondToken);
      heartbeat.reject(new TaskHoldemError("NOT_JOINED", "The previous seat expired."));
      await timer;
      await vi.waitFor(() => expect(io.sockets.sockets.get(client.id!)?.data.actor?.participantId).toBe(fresh.self.participantId));
      expect(success(await client.emitWithAck("room:sync", {})).self.participantId).toBe(fresh.self.participantId);
    } finally {
      heartbeat.resolve(update());
    }
  });
});
