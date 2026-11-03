import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, test } from "vitest";
import RevealAction from "../../../app/components/task-holdem/RevealAction.vue";
import { createTaskHoldemState, toTaskHoldemRoom } from "../../../server/domain/room";

const UButton = defineComponent({
  inheritAttrs: false,
  props: { label: String, disabled: Boolean },
  setup: (props, { attrs }) => () => h("button", { ...attrs, disabled: props.disabled }, props.label),
});
const UModal = defineComponent({
  props: { open: Boolean },
  setup: (props, { slots }) => () => props.open ? h("section", { role: "dialog" }, [slots.body?.(), slots.footer?.()]) : null,
});

function room() {
  const state = createTaskHoldemState("room-1");
  state.participants = ["Alice", "Bob"].map(name => ({ id: name, profile: { name, avatar: "cowboy" }, tokenHash: "a".repeat(64), connected: true }));
  const result = toTaskHoldemRoom({ state, revision: 1, changed: true, removedParticipantIds: [] });
  result.participants[0]!.hasVoted = true;
  return result;
}

describe("Task Hold'em reveal confirmation", () => {
  test("requires explicit confirmation for missing votes and cancellation leaves the round alone", async () => {
    const wrapper = mount(RevealAction, { props: { room: room(), disabled: false }, global: { stubs: { UButton, UModal } } });
    try {
      await wrapper.get("[data-testid='reveal-button']").trigger("click");
      expect(wrapper.get("[role='dialog']").text()).toContain("Bob");
      expect(wrapper.emitted("reveal")).toBeUndefined();
      await wrapper.findAll("button").find(button => button.text() === "Keep voting")!.trigger("click");
      expect(wrapper.find("[role='dialog']").exists()).toBe(false);
      expect(wrapper.emitted("reveal")).toBeUndefined();
    } finally { wrapper.unmount(); }
  });

  test("reveals directly when every seat has a vote", async () => {
    const value = room();
    value.participants[1]!.hasVoted = true;
    const wrapper = mount(RevealAction, { props: { room: value, disabled: false }, global: { stubs: { UButton, UModal } } });
    try {
      await wrapper.get("button").trigger("click");
      expect(wrapper.emitted("reveal")).toHaveLength(1);
      expect(wrapper.find("[role='dialog']").exists()).toBe(false);
    } finally { wrapper.unmount(); }
  });

  test("includes reconnecting seats and updates missing votes without revealing automatically", async () => {
    const value = room();
    value.participants[1]!.connected = false;
    const wrapper = mount(RevealAction, { props: { room: value, disabled: false }, global: { stubs: { UButton, UModal } } });
    try {
      await wrapper.get("button").trigger("click");
      expect(wrapper.text()).toContain("Reconnecting…");
      await wrapper.setProps({ room: { ...value, participants: [value.participants[0]!] } });
      expect(wrapper.text()).toContain("Everyone has now voted");
      expect(wrapper.emitted("reveal")).toBeUndefined();
      await wrapper.findAll("button").find(button => button.text() === "Reveal cards now")!.trigger("click");
      expect(wrapper.emitted("reveal")).toHaveLength(1);
    } finally { wrapper.unmount(); }
  });

  test.each(["round", "phase", "connection"])("closes obsolete confirmation after a changed %s", async (change) => {
    const value = room();
    const wrapper = mount(RevealAction, { props: { room: value, disabled: false }, global: { stubs: { UButton, UModal } } });
    try {
      await wrapper.get("button").trigger("click");
      if (change === "connection") await wrapper.setProps({ disabled: true });
      else await wrapper.setProps({ room: { ...value, round: { ...value.round, ...(change === "round" ? { id: "new-round" } : { phase: "revealed" }) } } });
      expect(wrapper.find("[role='dialog']").exists()).toBe(false);
      expect(wrapper.emitted("reveal")).toBeUndefined();
    } finally { wrapper.unmount(); }
  });
});
