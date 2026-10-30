import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as dao from "#server/dao/task-holdem.dao";
import * as service from "#server/services/task-holdem.service";
import { TaskHoldemError, type TaskHoldemMutation, type TaskHoldemState, type TaskHoldemActor } from "#server/domain/task-holdem/room";
import { taskHoldemConfig } from "#server/utils/task-holdem-config";

vi.mock("#server/dao/task-holdem.dao", () => ({
  createRoom: vi.fn(), mutateRoom: vi.fn(), inspectRoom: vi.fn(), findDueRooms: vi.fn(), listRoomHistory: vi.fn(),
}));

const roomId = randomUUID();
const command = { roomId, token: "a".repeat(64), profile: { name: "Alice", avatar: "spirit" } } satisfies Parameters<typeof service.joinRoom>[0];
let stored: TaskHoldemMutation;
let revision: number;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-30T12:00:00Z"));
  vi.clearAllMocks();
  revision = 0;
  vi.mocked(dao.createRoom).mockImplementation(async (state: TaskHoldemState) => {
    stored = { state: structuredClone(state), leases: [], completedRounds: [] };
  });
  vi.mocked(dao.mutateRoom).mockImplementation(async (_id, mutate) => {
    const copy = structuredClone(stored);
    copy.completedRounds = [];
    const previous = JSON.stringify(copy.state);
    const participants = copy.state.participants.map(participant => participant.id);
    mutate(copy);
    const changed = previous !== JSON.stringify(copy.state);
    revision += changed ? 1 : 0;
    stored = copy;
    return {
      state: structuredClone(copy.state), revision, changed,
      removedParticipantIds: participants.filter(id => !copy.state.participants.some(participant => participant.id === id)),
    };
  });
});

afterEach(() => vi.useRealTimers());

async function createActor(): Promise<TaskHoldemActor> {
  const connectionId = randomUUID();
  const update = await service.createRoom(command, connectionId);
  return { roomId, connectionId, participantId: service.getJoinedParticipant(update, command.token) };
}

describe("Task Hold'em service", () => {
  test("creates a server-owned participant and stores only a credential hash", async () => {
    const actor = await createActor();
    const member = stored.state.participants[0]!;
    expect(member.id).toBe(actor.participantId);
    expect(member.tokenHash).not.toBe(command.token);
    expect(member.tokenHash).toHaveLength(64);
    expect(JSON.stringify(stored)).not.toContain(command.token);
  });

  test("restores a seat and vote with its credential, but never by public participant ID", async () => {
    const actor = await createActor();
    await service.selectVote(actor, { roundId: stored.state.round.id, value: 8 });
    await service.disconnect(actor);
    vi.advanceTimersByTime(1000);
    const connectionId = randomUUID();
    const rejoined = await service.joinRoom({ ...command, profile: { name: "Forged profile", avatar: "dragon" } }, connectionId);
    expect(rejoined.state.participants).toHaveLength(1);
    expect(rejoined.state.participants[0]?.profile).toEqual(command.profile);
    expect(service.getJoinedParticipant(rejoined, command.token)).toBe(actor.participantId);
    expect(rejoined.state.round.ballots[0]?.value).toBe(8);
    expect(() => service.getJoinedParticipant(rejoined, "b".repeat(64))).toThrow(TaskHoldemError);
  });

  test("joining twice on one connection is idempotent and cannot switch credentials", async () => {
    const actor = await createActor();
    await service.joinRoom(command, actor.connectionId);
    expect(stored.leases).toHaveLength(1);
    expect(stored.state.participants).toHaveLength(1);
    await expect(service.joinRoom({ ...command, token: "b".repeat(64) }, actor.connectionId)).rejects.toThrowError("Leave the room");
    expect(stored.state.participants).toHaveLength(1);
  });

  test("a stale disconnect cannot remove a reconnected participant", async () => {
    const actor = await createActor();
    await service.joinRoom(command, "new-connection");
    await service.disconnect(actor);
    expect(stored.state.participants[0]?.connected).toBe(true);
    vi.advanceTimersByTime(taskHoldemConfig.graceMs + 1);
    await service.reconcileRoom(roomId);
    expect(stored.state.participants[0]?.id).toBe(actor.participantId);
  });

  test("leaving removes all connections immediately and revokes the old actor", async () => {
    const actor = await createActor();
    await service.joinRoom(command, "another-tab");
    await service.leaveRoom(actor);
    expect(stored.leases).toEqual([]);
    expect(stored.state.participants).toEqual([]);
    await expect(service.syncRoom(actor)).rejects.toThrow(TaskHoldemError);
  });

  test("removes a disconnected participant only after the grace period", async () => {
    const actor = await createActor();
    await service.selectVote(actor, { roundId: stored.state.round.id, value: 8 });
    await service.disconnect(actor);
    expect(stored.state.participants[0]?.connected).toBe(false);
    await service.reconcileRoom(roomId);
    expect(stored.state.round.ballots).toHaveLength(1);
    vi.advanceTimersByTime(taskHoldemConfig.graceMs + 1);
    await service.reconcileRoom(roomId);
    expect(stored.state.participants).toEqual([]);
    expect(stored.state.round.ballots).toEqual([]);
  });

  test("recovers an expired lease after an instance disappears without disconnecting", async () => {
    await createActor();
    vi.advanceTimersByTime(taskHoldemConfig.leaseMs + 1);
    await service.reconcileRoom(roomId);
    expect(stored.state.participants).toEqual([]);
  });

  test("renews an active connection without changing the room revision", async () => {
    const actor = await createActor();
    const before = revision;
    vi.advanceTimersByTime(1000);
    const update = await service.heartbeat(actor);
    expect(update.revision).toBe(before);
    expect(stored.leases[0]?.expiresAt).toBe(Date.now() + taskHoldemConfig.leaseMs);
  });

  test("attributes chat to the authenticated participant and generates its metadata", async () => {
    const actor = await createActor();
    const { message } = await service.createMessage(actor, "Ready?");
    expect(message).toMatchObject({ roomId, participantId: actor.participantId, author: command.profile, content: "Ready?", createdAt: Date.now() });
    expect(message.id).toBeTruthy();
    await service.leaveRoom(actor);
    await expect(service.createMessage(actor, "Forged message")).rejects.toThrow(TaskHoldemError);
  });

  test("completes a reveal on resynchronization without client-owned progression", async () => {
    const actor = await createActor();
    await service.selectVote(actor, { roundId: stored.state.round.id, value: 8 });
    await service.revealRound(actor, stored.state.round.id);
    vi.advanceTimersByTime(taskHoldemConfig.revealMs);
    const update = await service.syncRoom(actor);
    expect(update.state.round.phase).toBe("revealed");
    expect(stored.completedRounds).toHaveLength(1);
  });

  test("authenticates history reads and scopes them to the actor's room", async () => {
    const actor = await createActor();
    vi.mocked(dao.listRoomHistory).mockResolvedValue({ items: [], nextBefore: null });
    const { history } = await service.getHistory(actor, 12);
    expect(history.items).toEqual([]);
    expect(dao.listRoomHistory).toHaveBeenCalledWith(roomId, 12);
    await service.leaveRoom(actor);
    vi.mocked(dao.listRoomHistory).mockClear();
    await expect(service.getHistory(actor)).rejects.toThrow(TaskHoldemError);
    expect(dao.listRoomHistory).not.toHaveBeenCalled();
  });

  test("updates topics only for active members of the current round", async () => {
    const actor = await createActor();
    await service.setTopic(actor, { roundId: stored.state.round.id, topic: "Checkout", previousTopic: null });
    expect(stored.state.round.topic).toBe("Checkout");
    await expect(service.setTopic(actor, { roundId: randomUUID(), topic: "Stale", previousTopic: "Checkout" })).rejects.toThrowError("new round");
    await service.leaveRoom(actor);
    await expect(service.setTopic(actor, { roundId: stored.state.round.id, topic: "Forged", previousTopic: "Checkout" })).rejects.toThrow(TaskHoldemError);
  });
});
