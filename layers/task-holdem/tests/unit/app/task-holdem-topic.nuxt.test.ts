import { randomUUID } from "node:crypto";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, test, vi } from "vitest";
import Topic from "../../../app/components/task-holdem/Topic.vue";
import { taskHoldemDeck, type TaskHoldemRoom } from "../../../shared/types/task-holdem.type";

type Round = TaskHoldemRoom["round"];
type SaveTopic = (topic: string, previousTopic: string | null) => Promise<boolean>;

const cleanup: (() => void)[] = [];

function createRound(topic: string | null = null): Round {
  return {
    id: randomUUID(), number: 1, phase: "voting", topic, startedAt: 1000,
    revealedAt: null, revealAt: null, deck: [...taskHoldemDeck], ballots: null, average: null,
  };
}

async function mountTopic(round = createRound(), saveTopic: SaveTopic = async () => false, disabled = false) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  cleanup.push(() => host.remove());
  const wrapper = await mountSuspended(Topic, { props: { round, saveTopic, disabled }, attachTo: host });
  cleanup.push(() => wrapper.unmount());
  return wrapper;
}

function button(wrapper: VueWrapper, label: string) {
  const match = wrapper.findAll("button").find(node => node.text() === label);
  if (!match) throw new Error(`Button not found: ${label}`);
  return match;
}

afterEach(() => { while (cleanup.length) cleanup.pop()?.(); });

describe("Task Hold'em topic editor", () => {
  test("opens empty topics immediately without stealing focus or enabling empty saves", async () => {
    const wrapper = await mountTopic();
    const input = wrapper.get("input");
    expect(input.element.value).toBe("");
    expect(document.activeElement).not.toBe(input.element);
    expect(button(wrapper, "Edit topic").attributes("disabled")).toBeDefined();
    expect(button(wrapper, "Save topic").attributes("disabled")).toBeDefined();
    expect(wrapper.findAll("button").some(node => node.text() === "Add topic")).toBe(false);
  });

  test("keeps a draft after a failed save and while room controls are temporarily disabled", async () => {
    const save = vi.fn<SaveTopic>().mockResolvedValue(false);
    const wrapper = await mountTopic(createRound(), save);
    await wrapper.get("input").setValue("  Keep this draft  ");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(save).toHaveBeenCalledWith("Keep this draft", null);
    expect(wrapper.get("input").element.value).toBe("  Keep this draft  ");
    await wrapper.setProps({ disabled: true });
    expect(wrapper.get("input").attributes("disabled")).toBeDefined();
    await wrapper.setProps({ disabled: false });
    expect(wrapper.get("input").element.value).toBe("  Keep this draft  ");
    expect(button(wrapper, "Save topic").attributes("disabled")).toBeUndefined();
  });

  test("follows the first remote topic when the empty editor has not been touched", async () => {
    const round = createRound();
    const wrapper = await mountTopic(round);
    await wrapper.setProps({ round: { ...round, topic: "A teammate's topic" } });
    expect(wrapper.find("input").exists()).toBe(false);
    expect(wrapper.text()).toContain("A teammate's topic");
    expect(button(wrapper, "Edit topic").attributes("disabled")).toBeUndefined();
  });

  test("preserves a local draft on remote updates and cancels to the latest saved topic", async () => {
    const round = createRound();
    const wrapper = await mountTopic(round);
    await wrapper.get("input").setValue("My draft");
    await wrapper.setProps({ round: { ...round, topic: "A teammate's topic" } });
    expect(wrapper.get("input").element.value).toBe("My draft");
    expect(wrapper.text()).toContain("A teammate updated the topic");
    await button(wrapper, "Cancel").trigger("click");
    expect(wrapper.find("input").exists()).toBe(false);
    expect(wrapper.text()).toContain("A teammate's topic");
  });

  test("keeps a focused empty field open when a teammate saves the first topic", async () => {
    const round = createRound();
    const wrapper = await mountTopic(round);
    const input = wrapper.get("input");
    input.element.focus();
    await wrapper.setProps({ round: { ...round, topic: "A teammate's topic" } });
    expect(wrapper.get("input").element).toBe(input.element);
    expect(document.activeElement).toBe(input.element);
    expect(wrapper.text()).toContain("A teammate updated the topic");
  });

  test("returns to direct entry after a saved topic is cleared", async () => {
    const round = createRound("Saved topic");
    const save = vi.fn<SaveTopic>(async (topic) => {
      await wrapper.setProps({ round: { ...round, topic: topic || null } });
      return true;
    });
    const wrapper = await mountTopic(round, save);
    await button(wrapper, "Edit topic").trigger("click");
    await wrapper.get("input").setValue("");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(save).toHaveBeenCalledWith("", "Saved topic");
    expect(wrapper.get("input").element.value).toBe("");
    expect(button(wrapper, "Edit topic").attributes("disabled")).toBeDefined();
    expect(button(wrapper, "Save topic").attributes("disabled")).toBeDefined();
  });

  test("does not close the new round's empty editor when an older save finishes", async () => {
    let finish: ((saved: boolean) => void) | undefined;
    const save: SaveTopic = () => new Promise(resolve => { finish = resolve; });
    const wrapper = await mountTopic(createRound(), save);
    await wrapper.get("input").setValue("Previous round's draft");
    await wrapper.get("form").trigger("submit");
    await wrapper.setProps({ round: { ...createRound(), number: 2 } });
    finish?.(true);
    await flushPromises();
    expect(wrapper.get("input").element.value).toBe("");
    expect(wrapper.get("input").attributes("disabled")).toBeUndefined();
    expect(button(wrapper, "Edit topic").attributes("disabled")).toBeDefined();
  });

  test("locks draft entry during reveal and starts the next round with an empty field", async () => {
    const round = createRound();
    const wrapper = await mountTopic(round);
    await wrapper.get("input").setValue("Unsaved draft");
    await wrapper.setProps({ round: { ...round, phase: "revealing" } });
    expect(wrapper.find("input").exists()).toBe(false);
    expect(wrapper.findAll("button").some(node => node.text() === "Edit topic")).toBe(false);
    await wrapper.setProps({ round: { ...createRound(), number: 2 } });
    expect(wrapper.get("input").element.value).toBe("");
  });
});
