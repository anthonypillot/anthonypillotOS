import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CardCompanion from "../../../app/components/task-holdem/CardCompanion.vue";
import TableCompanion from "../../../app/components/task-holdem/TableCompanion.vue";

const cleanup: (() => void)[] = [];
const play = vi.fn(() => true);
const Mascot = defineComponent({
  props: { avatar: String, active: Boolean, ambient: Boolean },
  setup(props, { expose }) {
    expose({ play });
    return () => h("svg", { "data-mascot": props.avatar, "data-active": props.active });
  },
});
const global = { stubs: { TaskHoldemMascot: Mascot } };
class MotionPreference extends EventTarget { matches = false; }
let preference: MotionPreference;

function mountCards(props: Partial<InstanceType<typeof CardCompanion>["$props"]> = {}) {
  const wrapper = mount(CardCompanion, { props: { avatar: "robot", participantId: "alice", vote: null, phase: "voting", active: true, ...props }, global });
  cleanup.push(() => wrapper.unmount());
  return wrapper;
}

function mountTable(props: Partial<InstanceType<typeof TableCompanion>["$props"]> = {}) {
  const wrapper = mount(TableCompanion, { props: { roundId: "round-1", phase: "voting", active: true, ...props }, global });
  cleanup.push(() => wrapper.unmount());
  return wrapper;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  preference = new MotionPreference();
  vi.spyOn(window, "matchMedia").mockReturnValue(preference as MediaQueryList);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  vi.stubGlobal("IntersectionObserver", undefined);
  play.mockReset().mockReturnValue(true);
});

afterEach(() => {
  cleanup.splice(0).forEach(dispose => dispose());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Task Hold'em personal card companion", () => {
  test("uses private context for special-card speech without issuing room actions", async () => {
    const wrapper = mountCards({ vote: 8 });
    expect(play).not.toHaveBeenCalled();
    await wrapper.setProps({ vote: "break" });
    expect(wrapper.text()).toContain("Dude... I don't know!");
    await wrapper.setProps({ vote: "skip" });
    expect(wrapper.text()).toContain("A tiny coffee break.");
    await wrapper.setProps({ vote: null });
    expect(play).not.toHaveBeenCalled();
    expect(wrapper.find("[data-testid='companion-speech']").exists()).toBe(false);
  });

  test("hides private speech while votes are locked and clears it for the next round", async () => {
    const wrapper = mountCards({ vote: "break" });
    expect(wrapper.text()).toContain("Dude... I don't know!");
    await wrapper.setProps({ phase: "revealing" });
    expect(wrapper.find("[data-testid='companion-speech']").exists()).toBe(false);
    await wrapper.setProps({ phase: "revealed" });
    expect(wrapper.find("[data-testid='companion-speech']").exists()).toBe(false);
    await wrapper.setProps({ phase: "voting", vote: null });
    expect(wrapper.find("[data-testid='companion-speech']").exists()).toBe(false);
  });

  test("does not replay snapshots received during reconnection or automatic readmission", async () => {
    const wrapper = mountCards();
    await wrapper.setProps({ active: false });
    await wrapper.setProps({ vote: "break" });
    await wrapper.setProps({ active: true });
    expect(play).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Dude... I don't know!");
  });

  test("exposes a keyboard-compatible greeting without emitting room actions", async () => {
    const wrapper = mountCards();
    const button = wrapper.get("button");
    expect(button.attributes("type")).toBe("button");
    expect(button.attributes("aria-label")).toBe("Say hello to your Robot");
    await button.trigger("click");
    expect(wrapper.emitted("select")).toBeUndefined();
    expect(wrapper.emitted("vote")).toBeUndefined();
  });

  test("names the chosen character and disables greetings while disconnected", async () => {
    const wrapper = mountCards({ avatar: "princess", active: false });
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get("button").attributes("aria-label")).toBe("Say hello to your Princess");
    await wrapper.get("button").trigger("click");
    expect(play).not.toHaveBeenCalled();
    await wrapper.setProps({ active: true });
    expect(wrapper.get("button").attributes("disabled")).toBeUndefined();
  });
});

describe("Task Hold'em decorative table appearances", () => {
  test("appears briefly behind a decorative card, then observes a long quiet period", async () => {
    const wrapper = mountTable();
    await nextTick();
    expect(wrapper.attributes("aria-hidden")).toBe("true");
    expect(wrapper.findAll("button, a, [tabindex], [aria-live]")).toHaveLength(0);
    expect(wrapper.attributes("data-appearance")).toBe("none");
    await vi.advanceTimersByTimeAsync(27_500);
    expect(wrapper.attributes("data-appearance")).toBe("card");
    expect(play).toHaveBeenCalledExactlyOnceWith("mischief", "secret");
    await vi.advanceTimersByTimeAsync(1500);
    expect(wrapper.attributes("data-appearance")).toBe("none");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(play).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(play).toHaveBeenCalledTimes(2);
    expect(wrapper.attributes("data-appearance")).not.toBe("card");
  });

  test.each([{ random: 0, appearance: "peek", avatar: "cowboy", motion: "signature" }, { random: 0.99, appearance: "moonwalk", avatar: "robot", motion: "moonwalk" }])("supports the $appearance surprise", async ({ random, appearance, avatar, motion }) => {
    vi.spyOn(Math, "random").mockReturnValue(random);
    const wrapper = mountTable();
    await nextTick();
    await vi.advanceTimersByTimeAsync(20_000 + random * 15_000);
    expect(wrapper.attributes("data-appearance")).toBe(appearance);
    expect(wrapper.get("svg").attributes("data-mascot")).toBe(avatar);
    expect(play).toHaveBeenCalledExactlyOnceWith(motion, "secret");
  });

  test("stays out of the countdown and only reacts after a real round transition", async () => {
    const wrapper = mountTable({ phase: "revealed" });
    await nextTick();
    await vi.advanceTimersByTimeAsync(3500);
    expect(play).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: "revealing" });
    await vi.advanceTimersByTimeAsync(40_000);
    expect(play).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: "revealed" });
    await vi.advanceTimersByTimeAsync(2800);
    expect(play).toHaveBeenCalledOnce();
  });

  test("does not leave a visible mascot when the shared stage is busy", async () => {
    play.mockReturnValue(false);
    const wrapper = mountTable();
    await nextTick();
    await vi.advanceTimersByTimeAsync(27_500);
    expect(wrapper.attributes("data-appearance")).toBe("none");
    expect(wrapper.get("svg").attributes("data-active")).toBe("false");
  });

  test("cancels pending appearances for reduced motion, background tabs and navigation", async () => {
    const wrapper = mountTable();
    await nextTick();
    preference.matches = true;
    preference.dispatchEvent(new Event("change"));
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    preference.matches = false;
    preference.dispatchEvent(new Event("change"));
    await nextTick();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    expect(wrapper.attributes("data-appearance")).toBe("none");
    cleanup.pop()?.();
    expect(vi.getTimerCount()).toBe(0);
  });
});
