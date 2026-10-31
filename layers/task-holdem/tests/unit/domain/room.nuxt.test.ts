import { randomUUID } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  TaskHoldemError, createTaskHoldemState, reconcileTaskHoldemRoom, requireTaskHoldemMember,
  revealTaskHoldemRound, restartTaskHoldemRound, selectTaskHoldemVote, setTaskHoldemTopic, toTaskHoldemRoom, toTaskHoldemSelf,
  type TaskHoldemMutation, type TaskHoldemUpdate,
} from "../../../server/domain/room";
import { taskHoldemJoinSchema, taskHoldemSelectSchema } from "../../../shared/schemas/task-holdem.schema";

function createRoom(): TaskHoldemMutation {
  const state = createTaskHoldemState(randomUUID());
  state.participants.push(
    { id: randomUUID(), profile: { name: "Alice", avatar: "princess" }, tokenHash: "a".repeat(64), connected: true },
    { id: randomUUID(), profile: { name: "Bob", avatar: "cowboy" }, tokenHash: "b".repeat(64), connected: true },
  );
  return {
    state,
    completedRounds: [],
    leases: state.participants.map(participant => ({ id: randomUUID(), participantId: participant.id, connected: true, expiresAt: 10_000 })),
  };
}

function update(mutation: TaskHoldemMutation): TaskHoldemUpdate {
  return { state: mutation.state, revision: 3, changed: true, removedParticipantIds: [] };
}

describe("Task Hold'em round rules", () => {
  test("starts an empty voting round with the default deck", () => {
    const state = createTaskHoldemState(randomUUID());
    expect(state.participants).toEqual([]);
    expect(state.round).toMatchObject({ number: 1, phase: "voting", revealAt: null, ballots: [] });
    expect(state.round.deck).toEqual([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "skip", "break"]);
  });

  test("replaces one participant's vote without changing another vote", () => {
    const { state } = createRoom();
    const [alice, bob] = state.participants;
    expect(alice).toBeDefined();
    expect(bob).toBeDefined();
    selectTaskHoldemVote(state, alice!, { roundId: state.round.id, value: 8 });
    selectTaskHoldemVote(state, bob!, { roundId: state.round.id, value: 21 });
    selectTaskHoldemVote(state, alice!, { roundId: state.round.id, value: 13 });
    expect(state.round.ballots).toHaveLength(2);
    expect(state.round.ballots.find(ballot => ballot.participantId === alice!.id)?.value).toBe(13);
    expect(state.round.ballots.find(ballot => ballot.participantId === bob!.id)?.value).toBe(21);
  });

  test("clears a vote explicitly instead of persisting a presentation flag", () => {
    const { state } = createRoom();
    const alice = state.participants[0]!;
    selectTaskHoldemVote(state, alice, { roundId: state.round.id, value: 8 });
    selectTaskHoldemVote(state, alice, { roundId: state.round.id, value: null });
    expect(state.round.ballots).toEqual([]);
  });

  test("requires at least one vote to reveal", () => {
    const { state } = createRoom();
    expect(() => revealTaskHoldemRound({ state, roundId: state.round.id, now: 1000, duration: 2000 })).toThrowError("Select at least one card");
    expect(state.round.phase).toBe("voting");
  });

  test("locks votes and keeps the same deadline when reveal is requested twice", () => {
    const { state } = createRoom();
    const alice = state.participants[0]!;
    selectTaskHoldemVote(state, alice, { roundId: state.round.id, value: 8 });
    revealTaskHoldemRound({ state, roundId: state.round.id, now: 1000, duration: 2000 });
    revealTaskHoldemRound({ state, roundId: state.round.id, now: 2000, duration: 2000 });
    expect(state.round.revealAt).toBe(3000);
    expect(() => selectTaskHoldemVote(state, alice, { roundId: state.round.id, value: 13 })).toThrowError("Voting is closed");
  });

  test("completes the persisted reveal deadline without any browser transition", () => {
    const mutation = createRoom();
    selectTaskHoldemVote(mutation.state, mutation.state.participants[0]!, { roundId: mutation.state.round.id, value: 8 });
    revealTaskHoldemRound({ state: mutation.state, roundId: mutation.state.round.id, now: 1000, duration: 2000 });
    reconcileTaskHoldemRoom(mutation, 2999);
    expect(mutation.state.round.phase).toBe("revealing");
    reconcileTaskHoldemRoom(mutation, 3000);
    expect(mutation.state.round.phase).toBe("revealed");
  });

  test("does not expose other votes, their average, or credentials before reveal", () => {
    const mutation = createRoom();
    const alice = mutation.state.participants[0]!;
    selectTaskHoldemVote(mutation.state, alice, { roundId: mutation.state.round.id, value: 8 });
    for (const phase of ["voting", "revealing"] satisfies (typeof mutation.state.round.phase)[]) {
      mutation.state.round.phase = phase;
      const room = toTaskHoldemRoom(update(mutation), 1000);
      expect(room.round.ballots).toBeNull();
      expect(room.round.average).toBeNull();
      expect(room.participants[0]).toMatchObject({ hasVoted: true });
      expect(JSON.stringify(room)).not.toContain("tokenHash");
      expect(JSON.stringify(room)).not.toContain(alice.tokenHash);
    }
    expect(toTaskHoldemSelf(update(mutation), alice.id).vote).toBe(8);
    expect(toTaskHoldemSelf(update(mutation), mutation.state.participants[1]!.id).vote).toBeNull();
  });

  test.each([
    { votes: [8, 21], average: 14.5 },
    { votes: [8, "skip"], average: 8 },
    { votes: ["break", "skip"], average: null },
  ])("calculates the average of numeric votes only: $votes", ({ votes, average }) => {
    const mutation = createRoom();
    votes.forEach((value, index) => {
      const parsed = taskHoldemSelectSchema.parse({ roundId: mutation.state.round.id, value });
      selectTaskHoldemVote(mutation.state, mutation.state.participants[index]!, parsed);
    });
    mutation.state.round.phase = "revealed";
    const room = toTaskHoldemRoom(update(mutation));
    expect(room.round.average).toBe(average);
    expect(room.round.ballots).toHaveLength(2);
  });

  test("creates a new round and rejects delayed commands for the previous round", () => {
    const mutation = createRoom();
    const { state } = mutation;
    const previous = state.round.id;
    selectTaskHoldemVote(state, state.participants[0]!, { roundId: previous, value: 8 });
    state.round.phase = "revealed";
    restartTaskHoldemRound(state, previous);
    expect(state.round.id).not.toBe(previous);
    expect(state.round).toMatchObject({ number: 2, phase: "voting", ballots: [], revealAt: null });
    expect(toTaskHoldemSelf(update(mutation), state.participants[0]!.id).vote).toBeNull();
    expect(() => selectTaskHoldemVote(state, state.participants[0]!, { roundId: previous, value: 13 })).toThrowError("A new round has started");
    expect(() => restartTaskHoldemRound(state, previous)).toThrow(TaskHoldemError);
  });

  test("cannot restart an unrevealed round", () => {
    const { state } = createRoom();
    expect(() => restartTaskHoldemRound(state, state.round.id)).toThrowError("Reveal the cards");
  });
});

describe("Task Hold'em membership lifetime", () => {
  test("retains a disconnected participant and vote until the grace lease expires", () => {
    const mutation = createRoom();
    const alice = mutation.state.participants[0]!;
    selectTaskHoldemVote(mutation.state, alice, { roundId: mutation.state.round.id, value: 8 });
    mutation.leases[0]!.connected = false;
    mutation.leases[0]!.expiresAt = 2000;
    reconcileTaskHoldemRoom(mutation, 1999);
    expect(mutation.state.participants[0]).toMatchObject({ id: alice.id, connected: false });
    expect(mutation.state.round.ballots).toHaveLength(1);
    reconcileTaskHoldemRoom(mutation, 2000);
    expect(mutation.state.participants.some(participant => participant.id === alice.id)).toBe(false);
    expect(mutation.state.round.ballots).toEqual([]);
  });

  test("does not remove someone when an older connection expires", () => {
    const mutation = createRoom();
    const alice = mutation.state.participants[0]!;
    mutation.leases[0]!.connected = false;
    mutation.leases[0]!.expiresAt = 2000;
    mutation.leases.push({ id: randomUUID(), participantId: alice.id, connected: true, expiresAt: 10_000 });
    reconcileTaskHoldemRoom(mutation, 2000);
    expect(mutation.state.participants.find(participant => participant.id === alice.id)?.connected).toBe(true);
  });

  test("keeps frozen ballots and author snapshots when a participant leaves during reveal", () => {
    const mutation = createRoom();
    const alice = mutation.state.participants[0]!;
    selectTaskHoldemVote(mutation.state, alice, { roundId: mutation.state.round.id, value: 8 });
    alice.profile.name = "Changed later";
    revealTaskHoldemRound({ state: mutation.state, roundId: mutation.state.round.id, now: 1000, duration: 2000 });
    mutation.leases = mutation.leases.filter(lease => lease.participantId !== alice.id);
    reconcileTaskHoldemRoom(mutation, 3000);
    const room = toTaskHoldemRoom(update(mutation));
    expect(room.round.average).toBe(8);
    expect(room.round.ballots?.[0]?.profile.name).toBe("Alice");
    expect(room.participants.some(participant => participant.id === alice.id)).toBe(false);
  });

  test("requires a live connection belonging to the acting participant", () => {
    const mutation = createRoom();
    const alice = mutation.state.participants[0]!;
    const actor = { roomId: mutation.state.id, participantId: alice.id, connectionId: mutation.leases[0]!.id };
    expect(requireTaskHoldemMember(mutation, actor, 1000)).toBe(alice);
    expect(() => requireTaskHoldemMember(mutation, { ...actor, connectionId: mutation.leases[1]!.id }, 1000)).toThrow(TaskHoldemError);
    expect(() => requireTaskHoldemMember(mutation, actor, 10_000)).toThrow(TaskHoldemError);
  });
});

describe("Task Hold'em command validation", () => {
  test.each([0, 4, -1, 100, "8", {}, [], undefined])("rejects values outside the deck: %j", (value) => {
    expect(taskHoldemSelectSchema.safeParse({ roundId: randomUUID(), value }).success).toBe(false);
  });

  test("trims names and rejects empty profiles, weak credentials, and caller-owned state", () => {
    const valid = { roomId: randomUUID(), token: "a".repeat(64), profile: { name: "  Alice  ", avatar: "princess" } };
    expect(taskHoldemJoinSchema.parse(valid).profile.name).toBe("Alice");
    expect(taskHoldemJoinSchema.safeParse({ ...valid, token: "guessable" }).success).toBe(false);
    expect(taskHoldemJoinSchema.safeParse({ ...valid, profile: { name: "   ", avatar: "princess" } }).success).toBe(false);
    expect(taskHoldemJoinSchema.safeParse({ ...valid, users: [] }).success).toBe(false);
    expect(taskHoldemJoinSchema.safeParse({ ...valid, profile: { ...valid.profile, name: "a".repeat(41) } }).success).toBe(false);
  });
});

describe("Task Hold'em topics and history", () => {
  test("shares a trimmed optional topic and rejects conflicting edits", () => {
    const { state } = createRoom();
    const roundId = state.round.id;
    setTaskHoldemTopic(state, { roundId, topic: "  PROJ-42 · Sign-in  ", previousTopic: null });
    expect(state.round.topic).toBe("PROJ-42 · Sign-in");
    expect(() => setTaskHoldemTopic(state, { roundId, topic: "Overwrite", previousTopic: null })).toThrowError("teammate updated");
    setTaskHoldemTopic(state, { roundId, topic: "  ", previousTopic: state.round.topic });
    expect(state.round.topic).toBeNull();
  });

  test("locks the topic as soon as the reveal begins", () => {
    const { state } = createRoom();
    selectTaskHoldemVote(state, state.participants[0]!, { roundId: state.round.id, value: 8 });
    revealTaskHoldemRound({ state, roundId: state.round.id, now: 1000, duration: 2000 });
    expect(() => setTaskHoldemTopic(state, { roundId: state.round.id, topic: "Too late", previousTopic: null })).toThrowError("topic is locked");
  });

  test("archives once at the reveal deadline with immutable topic and profile snapshots", () => {
    const mutation = createRoom();
    const { state } = mutation;
    state.round.startedAt = 100;
    setTaskHoldemTopic(state, { roundId: state.round.id, topic: "PROJ-42", previousTopic: null });
    selectTaskHoldemVote(state, state.participants[0]!, { roundId: state.round.id, value: 13 });
    revealTaskHoldemRound({ state, roundId: state.round.id, now: 1000, duration: 2000 });
    reconcileTaskHoldemRoom(mutation, 2999);
    expect(mutation.completedRounds).toEqual([]);
    reconcileTaskHoldemRoom(mutation, 3500);
    reconcileTaskHoldemRoom(mutation, 4000);
    expect(mutation.completedRounds).toHaveLength(1);
    expect(mutation.completedRounds[0]).toMatchObject({ number: 1, topic: "PROJ-42", startedAt: 100, revealedAt: 3000, average: 13 });
    state.round.ballots[0]!.profile.name = "Changed";
    expect(mutation.completedRounds[0]?.ballots[0]?.profile.name).toBe("Alice");
    expect(JSON.stringify(mutation.completedRounds)).not.toContain("tokenHash");
  });

  test("keeps the archive when an overdue reveal and restart happen in the same mutation", () => {
    const mutation = createRoom();
    const { state } = mutation;
    const roundId = state.round.id;
    state.round.topic = "First topic";
    selectTaskHoldemVote(state, state.participants[0]!, { roundId, value: "skip" });
    revealTaskHoldemRound({ state, roundId, now: 1000, duration: 2000 });
    reconcileTaskHoldemRoom(mutation, 3000);
    restartTaskHoldemRound(state, roundId, 3000);
    expect(state.round).toMatchObject({ topic: null, startedAt: 3000, revealedAt: null, ballots: [] });
    expect(mutation.completedRounds[0]).toMatchObject({ id: roundId, topic: "First topic", average: null });
    expect(toTaskHoldemRoom(update(mutation)).historyCount).toBe(1);
  });
});
