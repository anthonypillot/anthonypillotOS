import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import LandingScene from "../../../app/components/task-holdem/LandingScene.vue";

const cleanup: (() => void)[] = [];
const observe = vi.fn();
const disconnect = vi.fn();
let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;

async function mountScene() {
  const wrapper = await mountSuspended(LandingScene);
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

describe("Task Hold'em landing scene", () => {
  test("reuses exactly three application characters with their speech bubbles and revealed cards", async () => {
    const wrapper = await mountScene();
    expect(wrapper.findAll("[data-mascot]").map(avatar => avatar.attributes("data-mascot"))).toEqual(["cowboy", "princess", "robot"]);
    expect(wrapper.findAll("[data-testid='preview-speech']").map(bubble => bubble.text())).toEqual(["A 5 for me.", "Hmm… maybe 8?", "Let's compare!"]);
    expect(wrapper.findAll(".scene-name").map(name => name.text())).toEqual(["Alex", "Sam", "Jordan"]);
    expect(wrapper.findAll("[data-testid='preview-card'] > span:nth-child(2)").map(card => card.text())).toEqual(["5", "8", "5"]);
    expect(wrapper.text()).toContain("Everyone has a seat at the table.");
  });

  test("keeps the decorative scene outside the accessibility and keyboard interaction trees", async () => {
    const wrapper = await mountScene();
    expect(wrapper.attributes("aria-hidden")).toBe("true");
    expect(wrapper.findAll("a, button, input, [tabindex], [aria-live], [role='status']")).toHaveLength(0);
    expect(observe).toHaveBeenCalledWith(wrapper.element);
  });

  test("pauses when offscreen or in a background tab and resumes when visible", async () => {
    const wrapper = await mountScene();
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

  test("cleans up its observer and page visibility listener on navigation", async () => {
    const wrapper = await mountScene();
    const removeListener = vi.spyOn(document, "removeEventListener");
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  test("still renders the complete scene without IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const wrapper = await mountScene();
    expect(wrapper.findAll("[data-mascot]")).toHaveLength(3);
    expect(wrapper.attributes("data-running")).toBe("true");
  });
});
