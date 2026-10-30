import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";
import { getTaskHoldemRoomCues, readTaskHoldemFeedback, saveTaskHoldemFeedback, taskHoldemSounds } from "../../../app/utils/task-holdem-feedback";
import { getTaskHoldemMascotPaths, taskHoldemMascotArt } from "../../../app/utils/task-holdem-mascots";
import { taskHoldemAvatarSchema } from "../../../shared/schemas/task-holdem.schema";
import { createTaskHoldemState, toTaskHoldemRoom } from "../../../server/domain/room";

function room() {
  const state = createTaskHoldemState(randomUUID(), 1000);
  state.participants.push(
    { id: randomUUID(), profile: { name: "Alice", avatar: "dragon" }, connected: true, tokenHash: "a".repeat(64) },
    { id: randomUUID(), profile: { name: "Bob", avatar: "slime" }, connected: true, tokenHash: "b".repeat(64) },
  );
  return toTaskHoldemRoom({ state, revision: 1, changed: true, removedParticipantIds: [] }, 1000);
}

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("Task Hold'em feedback", () => {
  test("ignores duplicate revisions, delayed snapshots and unrelated rooms", () => {
    const previous = room();
    const next = structuredClone(previous);
    next.round.phase = "revealed";
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual([]);
    next.revision = 0;
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual([]);
    next.revision = 2;
    next.id = randomUUID();
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual([]);
  });

  test("announces another participant's first vote without inspecting its value", () => {
    const previous = room();
    const next = structuredClone(previous);
    next.revision++;
    next.participants[1]!.hasVoted = true;
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual(["vote-received"]);
    next.participants[1]!.hasVoted = false;
    next.participants[0]!.hasVoted = true;
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual([]);
    expect(next.round.ballots).toBeNull();
  });

  test("emits one new-round cue instead of replaying reset votes and topics", () => {
    const previous = room();
    previous.round.topic = "Old topic";
    previous.round.phase = "revealed";
    const next = structuredClone(previous);
    next.revision++;
    next.round.id = randomUUID();
    next.round.topic = null;
    next.round.phase = "voting";
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual(["round-start"]);
  });

  test("distinguishes reveal start, results and topic updates", () => {
    const previous = room();
    const next = structuredClone(previous);
    next.revision++;
    next.round.phase = "revealing";
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual(["reveal-start"]);
    next.round.phase = "revealed";
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual(["reveal-end"]);
    next.round.phase = "voting";
    next.round.topic = "New topic";
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual(["topic"]);
  });

  test("does not announce a brief disconnect as a departure", () => {
    const previous = room();
    const next = structuredClone(previous);
    next.revision++;
    next.participants[1]!.connected = false;
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual([]);
    next.participants.pop();
    expect(getTaskHoldemRoomCues(previous, next, previous.participants[0]!.id)).toEqual(["left"]);
  });

  test("persists preferences and safely defaults when storage is corrupt or unavailable", () => {
    const preferences = readTaskHoldemFeedback();
    preferences.muted = true;
    saveTaskHoldemFeedback(preferences);
    expect(readTaskHoldemFeedback()).toEqual(preferences);
    localStorage.setItem("task-holdem:feedback:v1", "{broken");
    expect(readTaskHoldemFeedback()).toEqual({ muted: false });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    expect(readTaskHoldemFeedback().muted).toBe(false);
    expect(() => saveTaskHoldemFeedback(preferences)).not.toThrow();
  });

  test("preserves mute while discarding obsolete volume, category and notification settings", () => {
    localStorage.setItem("task-holdem:feedback:v1", JSON.stringify({
      muted: false, volume: 0, notifications: false,
      categories: { actions: false, votes: false, messages: false, rounds: false, presence: false },
    }));
    expect(readTaskHoldemFeedback()).toEqual({ muted: false });
    saveTaskHoldemFeedback({ muted: true });
    expect(JSON.parse(localStorage.getItem("task-holdem:feedback:v1")!)).toEqual({ muted: true });
  });

  test("keeps every sound short with a valid envelope and audible frequency", () => {
    for (const sound of Object.values(taskHoldemSounds)) {
      for (const note of sound.notes) {
        expect(note.frequency).toBeGreaterThan(200);
        expect(note.frequency).toBeLessThan(2000);
        expect(note.duration).toBeGreaterThan(0.008);
        expect(note.delay + note.duration).toBeLessThan(0.6);
      }
    }
  });
});

describe("Task Hold'em pixel companions", () => {
  test.each(taskHoldemAvatarSchema.options)("renders a complete original 16px sprite for %s", (avatar) => {
    const art = taskHoldemMascotArt[avatar];
    expect(art.rows).toHaveLength(16);
    for (const row of art.rows) {
      expect(row).toHaveLength(16);
      for (const pixel of row) if (pixel !== ".") expect(art.colors[pixel]).toMatch(/^#[a-f0-9]{6}$/i);
    }
    const paths = getTaskHoldemMascotPaths(avatar);
    expect(paths.some(part => part.eyes)).toBe(true);
    expect(paths.length).toBeGreaterThan(4);
  });
});
