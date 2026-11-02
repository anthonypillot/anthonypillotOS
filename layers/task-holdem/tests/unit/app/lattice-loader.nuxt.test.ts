import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import LatticeLoader from "../../../../../app/components/base/LatticeLoader.vue";
import PokerPlayer from "../../../app/components/task-holdem/PokerPlayer.vue";
import type { TaskHoldemParticipant, TaskHoldemPhase } from "../../../shared/types/room.type";

const cleanup: (() => void)[] = [];
const observe = vi.fn();
const disconnect = vi.fn();
let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;

function createHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  cleanup.push(() => host.remove());
  return host;
}

async function mountLoader() {
  const wrapper = await mountSuspended(LatticeLoader, {
    props: { status: "working", label: "Thinking…", announcement: "Alice: Thinking…" }, attachTo: createHost(),
  });
  cleanup.push(() => { if (wrapper.exists()) wrapper.unmount(); });
  return wrapper;
}

async function mountPlayer(hasVoted = false, phase: TaskHoldemPhase = "voting", connected = true) {
  const participant = { id: "alice", profile: { name: "Alice", avatar: "cowboy" }, hasVoted, connected } satisfies TaskHoldemParticipant;
  const wrapper = await mountSuspended(PokerPlayer, {
    props: { participant, phase, current: true, vote: null, celebrating: phase === "revealed" }, attachTo: createHost(),
  });
  cleanup.push(() => { if (wrapper.exists()) wrapper.unmount(); });
  return wrapper;
}

beforeEach(() => {
  observe.mockClear();
  disconnect.mockClear();
  intersect = undefined;
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) { intersect = callback; }
    observe = observe;
    disconnect = disconnect;
  });
});

afterEach(() => {
  while (cleanup.length) cleanup.pop()?.();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Lattice vote status", () => {
  test("shows a compact grid and a named accessible status without a timer", async () => {
    const wrapper = await mountLoader();
    expect(wrapper.get("[role='status']").attributes("aria-atomic")).toBe("true");
    expect(wrapper.get(".sr-only").text()).toBe("Alice: Thinking…");
    expect(wrapper.findAll(".lattice-run .lattice-cell")).toHaveLength(9);
    expect(wrapper.findAll(".lattice-mark .lattice-cell[data-on='true']")).toHaveLength(4);
    expect(wrapper.text()).not.toMatch(/\d+(?:\.\d+)?s\b/);
    expect(observe).toHaveBeenCalledWith(wrapper.element);
  });

  test("pauses outside the viewport and while the page is hidden", async () => {
    const wrapper = await mountLoader();
    expect(wrapper.attributes("data-running")).toBe("false");
    intersect?.([{ isIntersecting: true }]);
    await nextTick();
    expect(wrapper.attributes("data-running")).toBe("true");
    intersect?.([{ isIntersecting: false }]);
    await nextTick();
    expect(wrapper.attributes("data-running")).toBe("false");
    intersect?.([{ isIntersecting: true }]);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(wrapper.attributes("data-running")).toBe("false");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(wrapper.attributes("data-running")).toBe("true");
  });

  test("stops the orbit after a vote and resumes when the vote is cleared", async () => {
    const wrapper = await mountLoader();
    intersect?.([{ isIntersecting: true }]);
    await nextTick();
    await wrapper.setProps({ status: "done", label: "Vote is in", announcement: "Alice: Vote is in" });
    expect(wrapper.attributes("data-running")).toBe("false");
    expect(wrapper.get(".sr-only").text()).toBe("Alice: Vote is in");
    await wrapper.setProps({ status: "working", label: "Thinking…", announcement: "Alice: Thinking…" });
    expect(wrapper.attributes("data-running")).toBe("true");
  });

  test("releases its observer and visibility listener on unmount", async () => {
    const wrapper = await mountLoader();
    const removeListener = vi.spyOn(document, "removeEventListener");
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  test("remains usable when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const wrapper = await mountLoader();
    expect(wrapper.attributes("data-running")).toBe("true");
    expect(wrapper.text()).toContain("Thinking…");
  });

  test("does not show an active vote loader for disconnected participants", async () => {
    const wrapper = await mountPlayer(false, "voting", false);
    expect(wrapper.find("[role='status']").exists()).toBe(false);
    expect(wrapper.text()).toContain("Reconnecting…");
  });

  test("stops thinking for non-voters when voting locks and keeps revealed values", async () => {
    const wrapper = await mountPlayer();
    expect(wrapper.get("[role='status']").attributes("data-status")).toBe("working");
    await wrapper.setProps({ phase: "revealing" });
    expect(wrapper.find("[role='status']").exists()).toBe(false);
    expect(wrapper.text()).toContain("No vote");
    await wrapper.setProps({ phase: "revealed", vote: 13, participant: { id: "alice", profile: { name: "Alice", avatar: "cowboy" }, hasVoted: true, connected: true } });
    expect(wrapper.get("[role='status']").attributes("data-status")).toBe("done");
    expect(wrapper.text()).toContain("13");
  });
});
