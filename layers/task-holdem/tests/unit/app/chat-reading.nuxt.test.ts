import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Chat from "../../../app/components/task-holdem/Chat.vue";
import type { TaskHoldemMessage } from "../../../shared/types/room.type";

const cleanup: (() => void)[] = [];
const observers = new Map<Element, (visible: boolean) => void>();
const disconnect = vi.fn();
let focused = true;

function message(id: number, participantId = "bob"): TaskHoldemMessage {
  return { id: String(id), roomId: "room-1", participantId, author: { name: participantId, avatar: "cowboy" }, content: `Message ${id}`, createdAt: id };
}

function mountChat(messages: TaskHoldemMessage[] = []) {
  const wrapper = mount(Chat, { props: { messages, participantId: "alice", disabled: false, sending: false }, global: { stubs: { UInput: true, UButton: true, UIcon: true } } });
  cleanup.push(() => wrapper.unmount());
  return wrapper;
}

beforeEach(() => {
  focused = true;
  vi.spyOn(document, "hasFocus").mockImplementation(() => focused);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(element: Element) { observers.set(element, visible => this.callback([{ isIntersecting: visible }] as IntersectionObserverEntry[], this as unknown as IntersectionObserver)); }
    unobserve(element: Element) { observers.delete(element); }
    disconnect = disconnect;
  });
});

afterEach(() => {
  cleanup.splice(0).forEach(dispose => dispose());
  observers.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Task Hold'em local unread messages", () => {
  test("counts only new messages from other players and does not mark a closed chat as read", async () => {
    const wrapper = mountChat();
    await wrapper.setProps({ messages: [message(1), message(2, "alice")] });
    expect(wrapper.get("[role='status']").text()).toContain("1 unread message");
    await wrapper.setProps({ messages: [message(1), message(2, "alice")] });
    expect(wrapper.get("[role='status']").text()).toContain("1 unread message");
  });

  test("requires an open, visible chat in a focused document before marking messages read", async () => {
    const wrapper = mountChat([message(1)]);
    await wrapper.get("button").trigger("click");
    expect(wrapper.find("[role='status']").exists()).toBe(true);
    focused = false;
    for (const visible of observers.values()) visible(true);
    await nextTick();
    expect(wrapper.find("[role='status']").exists()).toBe(true);
    focused = true;
    window.dispatchEvent(new Event("focus"));
    await nextTick();
    expect(wrapper.find("[role='status']").exists()).toBe(false);
    for (const visible of observers.values()) visible(false);
    await wrapper.setProps({ messages: [message(1), message(2)] });
    expect(wrapper.get("[role='status']").text()).toContain("1 unread message");
  });

  test("preserves an older reading position and jumps only on request", async () => {
    const wrapper = mountChat([message(1)]);
    await wrapper.get("button").trigger("click");
    for (const visible of observers.values()) visible(true);
    const list = wrapper.get("[role='log']");
    Object.defineProperty(list.element, "scrollHeight", { configurable: true, value: 900 });
    Object.defineProperty(list.element, "clientHeight", { configurable: true, value: 256 });
    list.element.scrollTop = 120;
    await list.trigger("scroll");
    for (const visible of observers.values()) visible(false);
    await wrapper.setProps({ messages: [message(1), message(2)] });
    expect(list.element.scrollTop).toBe(120);
    expect(wrapper.get("[aria-label='Show new messages']").text()).toContain("1 new message");
    await wrapper.get("[aria-label='Show new messages']").trigger("click");
    expect(list.element.scrollTop).toBe(900);
    for (const visible of observers.values()) visible(true);
    await nextTick();
    expect(wrapper.find("[role='status']").exists()).toBe(false);
  });

  test("does not mark messages read in a hidden tab, even if the log was visible", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const wrapper = mountChat([message(1)]);
    await wrapper.get("button").trigger("click");
    for (const visible of observers.values()) visible(true);
    await nextTick();
    expect(wrapper.get("[role='status']").text()).toContain("1 unread message");
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(wrapper.find("[role='status']").exists()).toBe(false);
  });

  test("checks current viewport bounds before a delayed intersection callback arrives", async () => {
    const wrapper = mountChat([message(1)]);
    await wrapper.get("button").trigger("click");
    for (const visible of observers.values()) visible(true);
    await nextTick();
    const end = [...observers.keys()][0]!;
    vi.spyOn(end, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 2000, 1, 1));
    await wrapper.setProps({ messages: [message(1), message(2)] });
    expect(wrapper.get("[role='status']").text()).toContain("1 unread message");
  });

  test("tracks arrivals by identity after the retained message count reaches 100", async () => {
    const messages = Array.from({ length: 100 }, (_, index) => message(index));
    const wrapper = mountChat(messages);
    await wrapper.get("button").trigger("click");
    for (const visible of observers.values()) visible(true);
    await nextTick();
    expect(wrapper.find("[role='status']").exists()).toBe(false);
    await wrapper.get("button").trigger("click");
    await wrapper.setProps({ messages: [...messages.slice(1), message(100)] });
    expect(wrapper.get("[role='status']").text()).toContain("1 unread message");
  });
});
