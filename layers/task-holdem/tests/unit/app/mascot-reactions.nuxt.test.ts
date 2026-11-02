import { mount } from "@vue/test-utils";
import { computed, defineComponent, h, nextTick, shallowRef } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CardCompanion from "../../../app/components/task-holdem/CardCompanion.vue";
import PokerPlayer from "../../../app/components/task-holdem/PokerPlayer.vue";
import User from "../../../app/components/task-holdem/User.vue";
import { provideTaskHoldemMascots } from "../../../app/composables/useMascot";
import { provideTaskHoldemMascotReactions } from "../../../app/composables/useMascotReactions";
import { getTaskHoldemMascotReactions, type TaskHoldemMascotView } from "../../../app/utils/mascot-reactions";
import type { TaskHoldemRoom, TaskHoldemSelf, TaskHoldemVote } from "../../../shared/types/room.type";
import { createTaskHoldemState, toTaskHoldemRoom } from "../../../server/domain/room";

type View = TaskHoldemMascotView & { room: TaskHoldemRoom; self: TaskHoldemSelf };
const cleanup: (() => void)[] = [];
class MotionPreference extends EventTarget { matches = false; }
let preference: MotionPreference;

function view(): View {
  const state = createTaskHoldemState("room-1", 1000);
  state.participants.push(
    { id: "alice", profile: { name: "Alice", avatar: "robot" }, tokenHash: "a".repeat(64), connected: true },
    { id: "bob", profile: { name: "Bob", avatar: "doctor" }, tokenHash: "b".repeat(64), connected: true },
  );
  const room = toTaskHoldemRoom({ state, revision: 1, changed: true, removedParticipantIds: [] }, 1000);
  return { room, self: { roomId: room.id, revision: 1, participantId: "alice", roundId: room.round.id, vote: null }, active: true };
}

function vote(previous: View, participantId: string, value: TaskHoldemVote | null): View {
  const next = structuredClone(previous);
  next.room.revision++;
  next.room.participants.find(participant => participant.id === participantId)!.hasVoted = value !== null;
  if (participantId === next.self.participantId) { next.self.revision = next.room.revision; next.self.vote = value; }
  return next;
}

function mountRoom(initial = view()) {
  const state = shallowRef(initial);
  const room = computed(() => state.value.room);
  const self = computed(() => state.value.self);
  const wrapper = mount(defineComponent({
    setup() {
      provideTaskHoldemMascots();
      provideTaskHoldemMascotReactions(room, self, () => state.value.active);
      return () => h("div", [
        h(User, { participant: room.value.participants[0]!, disabled: !state.value.active, active: state.value.active, "data-testid": "profile-avatar" }),
        h(CardCompanion, { participantId: self.value.participantId, avatar: "robot", vote: self.value.vote, phase: room.value.round.phase, active: state.value.active }),
        ...room.value.participants.map(participant => h(PokerPlayer, { key: participant.id, participant, phase: room.value.round.phase, current: participant.id === self.value.participantId, vote: null, active: state.value.active })),
      ]);
    },
  }), { global: { stubs: { BaseLatticeLoader: true, UButton: true } } });
  cleanup.push(() => wrapper.unmount());
  return { wrapper, state };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  preference = new MotionPreference();
  vi.spyOn(window, "matchMedia").mockReturnValue(preference as MediaQueryList);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  vi.stubGlobal("IntersectionObserver", undefined);
});

afterEach(() => {
  cleanup.splice(0).forEach(dispose => dispose());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Task Hold'em confirmed mascot reactions", () => {
  test.each([{ value: 8, motion: "vote" }, { value: "break", motion: "think" }, { value: "skip", motion: "break" }] satisfies { value: TaskHoldemVote; motion: string }[])("uses $motion only for the current participant's confirmed $value choice", ({ value, motion }) => {
    const previous = view();
    const next = vote(previous, "alice", value);
    expect([...getTaskHoldemMascotReactions(previous, next)]).toEqual([["alice", motion]]);
    const observerBefore = structuredClone(previous);
    observerBefore.self.participantId = "bob";
    const observerAfter = { ...next, self: observerBefore.self };
    expect([...getTaskHoldemMascotReactions(observerBefore, observerAfter)]).toEqual([["alice", "vote"]]);
  });

  test("reacts to changing and clearing a private vote without inferring another player's changes", () => {
    const first = vote(view(), "alice", 8);
    const changed = vote(first, "alice", "break");
    expect([...getTaskHoldemMascotReactions(first, changed)]).toEqual([["alice", "think"]]);
    expect([...getTaskHoldemMascotReactions(changed, vote(changed, "alice", null))]).toEqual([["alice", "glance"]]);
    const bobVoted = vote(first, "bob", 8);
    expect(getTaskHoldemMascotReactions(bobVoted, vote(bobVoted, "bob", "skip")).size).toBe(0);
    expect([...getTaskHoldemMascotReactions(bobVoted, vote(bobVoted, "bob", null))]).toEqual([["bob", "glance"]]);
  });

  test("reacts once when the public vote status arrives before its private confirmation", () => {
    const previous = view();
    const confirmed = vote(previous, "alice", "break");
    const publicFirst = { ...confirmed, self: previous.self };
    expect(getTaskHoldemMascotReactions(previous, publicFirst).size).toBe(0);
    expect([...getTaskHoldemMascotReactions(publicFirst, confirmed)]).toEqual([["alice", "think"]]);
  });

  test("does not replay a private reaction when the public snapshot arrives later", () => {
    const previous = view();
    const confirmed = vote(previous, "alice", "skip");
    const privateFirst = { ...previous, self: confirmed.self };
    expect([...getTaskHoldemMascotReactions(previous, privateFirst)]).toEqual([["alice", "break"]]);
    expect(getTaskHoldemMascotReactions(privateFirst, confirmed).size).toBe(0);
  });

  test("celebrates all connected players together and greets a new round once", () => {
    const previous = view();
    previous.room.round.phase = "revealing";
    const revealed = structuredClone(previous);
    revealed.room.round.phase = "revealed";
    expect([...getTaskHoldemMascotReactions(previous, revealed)]).toEqual([["alice", "reveal"], ["bob", "reveal"]]);
    const next = structuredClone(revealed);
    next.room.round.id = "round-2";
    next.room.round.phase = "voting";
    expect([...getTaskHoldemMascotReactions(revealed, next)]).toEqual([["alice", "signature"], ["bob", "signature"]]);
    expect(getTaskHoldemMascotReactions(next, structuredClone(next)).size).toBe(0);
  });

  test("ignores reconnects, room changes, stale snapshots and restored special votes", () => {
    const previous = view();
    const next = vote(previous, "alice", "skip");
    expect(getTaskHoldemMascotReactions({ ...previous, active: false }, next).size).toBe(0);
    expect(getTaskHoldemMascotReactions(previous, { ...next, active: false }).size).toBe(0);
    expect(getTaskHoldemMascotReactions({ ...previous, room: null, self: null }, next).size).toBe(0);
    const otherRoom = structuredClone(next);
    otherRoom.room.id = "another-room";
    expect(getTaskHoldemMascotReactions(previous, otherRoom).size).toBe(0);
    expect(getTaskHoldemMascotReactions(next, previous).size).toBe(0);
    const disconnected = structuredClone(next);
    disconnected.room.participants[0]!.connected = false;
    expect(getTaskHoldemMascotReactions(previous, disconnected).size).toBe(0);
  });
});

describe("Task Hold'em shared player-avatar interactions", () => {
  test("mirrors confirmed choices across the card companion, player list and profile", async () => {
    const { wrapper, state } = mountRoom();
    await nextTick();
    const avatars = wrapper.findAll("[data-mascot='robot']");
    expect(avatars).toHaveLength(3);
    state.value = vote(state.value, "alice", "break");
    await nextTick();
    for (const avatar of avatars) expect(avatar.attributes("data-motion")).toBe("think");
    state.value = vote(state.value, "alice", "skip");
    await nextTick();
    for (const avatar of avatars) expect(avatar.attributes("data-motion")).toBe("break");
    state.value = vote(state.value, "alice", null);
    await nextTick();
    for (const avatar of avatars) expect(avatar.attributes("data-motion")).toBe("glance");
  });

  test("plays reveal and new-round reactions for every player without mutual cancellation", async () => {
    const { wrapper, state } = mountRoom();
    await nextTick();
    const next = structuredClone(state.value);
    next.room.round.phase = "revealed";
    state.value = next;
    await nextTick();
    for (const avatar of wrapper.findAll("[data-mascot]")) expect(avatar.attributes("data-motion")).toBe("reveal");
    const restart = structuredClone(next);
    restart.room.round.id = "round-2";
    restart.room.round.phase = "voting";
    state.value = restart;
    await nextTick();
    for (const avatar of wrapper.findAll("[data-mascot]")) expect(avatar.attributes("data-motion")).toBe("signature");
  });

  test("shares greetings and their cooldown between both clickable avatar locations", async () => {
    const { wrapper, state } = mountRoom();
    const original = structuredClone(state.value);
    await nextTick();
    await wrapper.get("[data-testid='card-companion'] button").trigger("click");
    for (const avatar of wrapper.findAll("[data-mascot='robot']")) expect(avatar.attributes("data-motion")).toBe("moonwalk");
    await vi.advanceTimersByTimeAsync(1800);
    await wrapper.get("[data-participant-id='alice'] button").trigger("click");
    for (const avatar of wrapper.findAll("[data-mascot='robot']")) expect(avatar.attributes("data-motion")).toBe("rest");
    await vi.advanceTimersByTimeAsync(6200);
    await wrapper.get("[data-participant-id='alice'] button").trigger("click");
    for (const avatar of wrapper.findAll("[data-mascot='robot']")) expect(avatar.attributes("data-motion")).toBe("moonwalk");
    expect(state.value).toEqual(original);
  });

  test("greets another character locally without changing votes or the current player's reaction", async () => {
    const { wrapper, state } = mountRoom();
    const original = structuredClone(state.value);
    await nextTick();
    await wrapper.get("[data-participant-id='bob'] button").trigger("click");
    expect(wrapper.get("[data-mascot='doctor']").attributes("data-motion")).toBe("mischief");
    for (const avatar of wrapper.findAll("[data-mascot='robot']")) expect(avatar.attributes("data-motion")).toBe("rest");
    expect(state.value).toEqual(original);
  });

  test("does not replay reactions on readmission or when reduced motion is enabled", async () => {
    const { wrapper, state } = mountRoom({ ...view(), active: false });
    await nextTick();
    const restored = vote(state.value, "alice", "break");
    restored.active = true;
    state.value = restored;
    await nextTick();
    for (const avatar of wrapper.findAll("[data-mascot]")) expect(avatar.attributes("data-motion")).toBe("rest");
    preference.matches = true;
    preference.dispatchEvent(new Event("change"));
    state.value = vote(restored, "alice", "skip");
    await nextTick();
    for (const avatar of wrapper.findAll("[data-mascot]")) expect(avatar.attributes("data-motion")).toBe("rest");
    cleanup.pop()?.();
    expect(vi.getTimerCount()).toBe(0);
  });
});
