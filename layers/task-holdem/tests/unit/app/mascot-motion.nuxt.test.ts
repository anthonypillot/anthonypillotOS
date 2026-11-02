import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Mascot from "../../../app/components/task-holdem/Mascot.vue";
import { taskHoldemAvatarSchema } from "../../../shared/schemas/room.schema";
import { getTaskHoldemMascotPaths, taskHoldemMascotArt } from "../../../app/utils/mascots";
import { getTaskHoldemMascotPixels, taskHoldemMascotPropColors } from "../../../app/utils/mascot-poses";
import { createTaskHoldemMascotStage, pickTaskHoldemMascotMotion, taskHoldemMascotMotions } from "../../../app/utils/mascot-motion";

const cleanup: (() => void)[] = [];
const observers = new Map<Element, (visible: boolean) => void>();
const disconnect = vi.fn();
class MotionPreference extends EventTarget { matches = false; }
let preference: MotionPreference;

function mountMascot(props: Partial<InstanceType<typeof Mascot>["$props"]> = {}) {
  const wrapper = mount(Mascot, { props: { avatar: "cowboy", ...props } });
  cleanup.push(() => { if (wrapper.exists()) wrapper.unmount(); });
  observers.get(wrapper.element)?.(true);
  return wrapper;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  preference = new MotionPreference();
  vi.spyOn(window, "matchMedia").mockReturnValue(preference as MediaQueryList);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  disconnect.mockClear();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(element: Element) { observers.set(element, visible => this.callback([{ isIntersecting: visible }] as IntersectionObserverEntry[], this as unknown as IntersectionObserver)); }
    disconnect = disconnect;
  });
});

afterEach(() => {
  cleanup.splice(0).forEach(dispose => dispose());
  observers.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Task Hold'em pixel poses", () => {
  test.each(taskHoldemAvatarSchema.options)("%s keeps its resting artwork and has complete, distinct signature poses", (avatar) => {
    const art = taskHoldemMascotArt[avatar];
    const original = structuredClone(art);
    const rest = getTaskHoldemMascotPaths(avatar);
    expect(getTaskHoldemMascotPaths(avatar, "gesture")).not.toEqual(rest);
    expect(getTaskHoldemMascotPaths(avatar, "flourish")).not.toEqual(getTaskHoldemMascotPaths(avatar, "gesture"));
    expect(getTaskHoldemMascotPaths(avatar, "mischief")).not.toEqual(rest);
    const poses = new Set(Object.values(taskHoldemMascotMotions).flatMap(frames => frames.map(frame => frame.pose)));
    for (const pose of poses) {
      const pixels = getTaskHoldemMascotPixels(art, avatar, pose);
      expect(pixels.length).toBeGreaterThan(90);
      expect(new Set(pixels.map(pixel => `${pixel.x},${pixel.y}`)).size).toBe(pixels.length);
      for (const pixel of pixels) {
        expect(Number.isInteger(pixel.x) && Number.isInteger(pixel.y)).toBe(true);
        expect(pixel.x).toBeGreaterThanOrEqual(-1);
        expect(pixel.x).toBeLessThan(17);
        expect(pixel.y).toBeGreaterThanOrEqual(-2);
        expect(pixel.y).toBeLessThan(17);
        expect(art.colors[pixel.ink] ?? taskHoldemMascotPropColors[pixel.ink]).toMatch(/^#[a-f0-9]{6}$/i);
      }
      expect(getTaskHoldemMascotPaths(avatar, pose)).toBe(getTaskHoldemMascotPaths(avatar, pose));
    }
    expect(art).toEqual(original);
  });

  test("varies ambient performances without immediate repetitions", () => {
    expect(pickTaskHoldemMascotMotion("glance", () => 0)).toBe("signature");
    expect(pickTaskHoldemMascotMotion("mischief", () => 0.99)).toBe("signature");
    for (const frames of Object.values(taskHoldemMascotMotions)) {
      expect(frames.every(frame => frame.duration >= 100)).toBe(true);
      expect(frames.reduce((total, frame) => total + frame.duration, 0)).toBeLessThan(2500);
    }
  });
});

describe("Task Hold'em shared mascot stage", () => {
  test("lets a new explicit action supersede an earlier gesture", () => {
    const stage = createTaskHoldemMascotStage();
    const stop = vi.fn();
    expect(stage.claim(Symbol("old selection"), stop, "reaction")).toBe(true);
    expect(stage.claim(Symbol("new selection"), vi.fn(), "reaction")).toBe(true);
    expect(stop).toHaveBeenCalledOnce();
  });

  test("allows one performance, prioritizes actions and bounds surprise frequency", () => {
    const stage = createTaskHoldemMascotStage();
    const alice = Symbol("alice");
    const bob = Symbol("bob");
    const stop = vi.fn();
    expect(stage.claim(alice, stop, "ambient")).toBe(true);
    expect(stage.claim(bob, vi.fn(), "ambient")).toBe(false);
    expect(stage.claim(bob, vi.fn(), "reaction")).toBe(true);
    expect(stop).toHaveBeenCalledOnce();
    stage.release(alice);
    expect(stage.claim(alice, stop, "secret")).toBe(false);
    stage.release(bob);
    expect(stage.claim(alice, stop, "ambient")).toBe(false);
    expect(stage.claim(alice, stop, "secret")).toBe(true);
    stage.release(alice);
    expect(stage.claim(bob, vi.fn(), "secret")).toBe(false);
    vi.advanceTimersByTime(60_000);
    expect(stage.claim(bob, vi.fn(), "secret")).toBe(true);
  });
});

describe("Task Hold'em mascot playback", () => {
  test("plays articulated frames and returns to the resting pose", async () => {
    const wrapper = mountMascot({ avatar: "robot", label: "Robot", ambient: false });
    await nextTick();
    expect(wrapper.attributes("role")).toBe("img");
    expect(wrapper.attributes("aria-label")).toBe("Robot");
    expect(wrapper.vm.play("signature")).toBe(true);
    await nextTick();
    expect(wrapper.attributes("data-pose")).toBe("gesture");
    const first = wrapper.find(".mascot-sprite").html();
    await vi.advanceTimersByTimeAsync(240);
    expect(wrapper.attributes("data-pose")).toBe("flourish");
    expect(wrapper.find(".mascot-sprite").html()).not.toBe(first);
    await vi.advanceTimersByTimeAsync(740);
    expect(wrapper.attributes("data-motion")).toBe("rest");
    expect(wrapper.attributes("data-pose")).toBe("rest");
    expect(wrapper.emitted("motion-end")).toEqual([["signature"]]);
  });

  test("does not replay existing votes or revealed rounds on mount or unrelated updates", async () => {
    const wrapper = mountMascot({ voted: true, celebrating: true });
    await nextTick();
    expect(wrapper.attributes("data-motion")).toBe("rest");
    await wrapper.setProps({ label: "Cowboy" });
    expect(wrapper.attributes("data-motion")).toBe("rest");
    await wrapper.setProps({ voted: false, celebrating: false });
    await wrapper.setProps({ voted: true });
    expect(wrapper.attributes("data-motion")).toBe("vote");
    await vi.advanceTimersByTimeAsync(680);
    await wrapper.setProps({ celebrating: true });
    expect(wrapper.attributes("data-motion")).toBe("reveal");
  });

  test("schedules occasional gestures and blinks instead of a synchronized looping bounce", async () => {
    const wrapper = mountMascot();
    await vi.advanceTimersByTimeAsync(5250);
    expect(wrapper.attributes("data-motion")).toBe("blink");
    await vi.advanceTimersByTimeAsync(240);
    expect(wrapper.attributes("data-pose")).toBe("rest");
    await vi.advanceTimersByTimeAsync(12_510);
    expect(wrapper.attributes("data-motion")).toBe("signature");
  });

  test("stops timers offscreen and does not replay a cancelled reaction when visible again", async () => {
    const wrapper = mountMascot();
    wrapper.vm.play("reveal");
    observers.get(wrapper.element)?.(false);
    await nextTick();
    expect(wrapper.attributes("data-running")).toBe("false");
    expect(wrapper.attributes("data-pose")).toBe("rest");
    expect(vi.getTimerCount()).toBe(0);
    observers.get(wrapper.element)?.(true);
    await nextTick();
    expect(wrapper.attributes("data-motion")).toBe("rest");
    expect(vi.getTimerCount()).toBe(2);
  });

  test("honors live reduced-motion, active and background-tab changes", async () => {
    const wrapper = mountMascot();
    preference.matches = true;
    preference.dispatchEvent(new Event("change"));
    await nextTick();
    expect(wrapper.vm.play("mischief")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    preference.matches = false;
    preference.dispatchEvent(new Event("change"));
    await wrapper.setProps({ active: false });
    expect(wrapper.vm.play("signature")).toBe(false);
    await wrapper.setProps({ active: true });
    expect(wrapper.vm.play("signature")).toBe(true);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(wrapper.attributes("data-pose")).toBe("rest");
    expect(vi.getTimerCount()).toBe(0);
  });

  test("cleans up observers, media listeners and every pending timer on navigation", () => {
    const wrapper = mountMascot();
    const removed = vi.spyOn(preference, "removeEventListener");
    wrapper.vm.play("moonwalk");
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledWith("change", expect.any(Function));
  });

  test("keeps decorative mascots accessible only through their parent and tolerates missing observers", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const wrapper = mountMascot();
    await nextTick();
    expect(wrapper.attributes("aria-hidden")).toBe("true");
    expect(wrapper.attributes("role")).toBeUndefined();
    expect(wrapper.attributes("data-running")).toBe("true");
  });
});
