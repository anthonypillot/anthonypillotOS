import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, test, vi } from "vitest";
import SessionReport from "../../../app/components/task-holdem/SessionReport.vue";
import type { TaskHoldemHistoryPage } from "../../../shared/types/room.type";

const UButton = defineComponent({
  inheritAttrs: false,
  props: { label: String, disabled: Boolean },
  setup: (props, { attrs }) => () => h("button", { ...attrs, disabled: props.disabled }, props.label),
});

afterEach(() => { vi.unstubAllGlobals(); });

describe("Task Hold'em report export lifecycle", () => {
  test("does not export a partial report after a failed page and lets the user retry", async () => {
    const load = vi.fn(async () => undefined);
    const wrapper = mount(SessionReport, { props: { count: 1, load }, global: { stubs: { UButton } } });
    try {
      await wrapper.get("button").trigger("click");
      await flushPromises();
      expect(wrapper.get("[role='alert']").text()).toContain("no partial report was exported");
      expect(wrapper.get("button").attributes("disabled")).toBeUndefined();
      await wrapper.get("button").trigger("click");
      await flushPromises();
      expect(load).toHaveBeenCalledTimes(2);
    } finally { wrapper.unmount(); }
  });

  test.each(["cancel", "unmount"])("does not copy or download when a pending export is interrupted by %s", async (action) => {
    let finish: ((page: TaskHoldemHistoryPage) => void) | undefined;
    const load = () => new Promise<TaskHoldemHistoryPage>(resolve => { finish = resolve; });
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const wrapper = mount(SessionReport, { props: { count: 1, load }, global: { stubs: { UButton } } });
    await wrapper.get("button").trigger("click");
    if (action === "cancel") await wrapper.findAll("button").find(button => button.text() === "Cancel export")!.trigger("click");
    else wrapper.unmount();
    finish?.({ items: [{ id: "round-1", number: 1, topic: null, startedAt: 1000, revealedAt: 3000, ballots: [], average: null }], nextBefore: null });
    await flushPromises();
    expect(writeText).not.toHaveBeenCalled();
    if (action === "cancel") {
      expect(wrapper.get("[role='status']").text()).toBe("Export cancelled.");
      expect(wrapper.find("[role='alert']").exists()).toBe(false);
      wrapper.unmount();
    }
  });
});
