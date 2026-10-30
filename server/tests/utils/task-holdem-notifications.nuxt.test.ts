import { randomUUID } from "node:crypto";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useTaskHoldemFeedback } from "~/composables/useTaskHoldemFeedback";
import { readTaskHoldemFeedback, saveTaskHoldemFeedback } from "~/utils/task-holdem-feedback";
import { createTaskHoldemState, toTaskHoldemRoom } from "#server/domain/task-holdem/room";

const nativeNotification = vi.fn();
const cleanup: (() => void)[] = [];
const serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, "locks");

function mountFeedback() {
  let feedback: ReturnType<typeof useTaskHoldemFeedback> | undefined;
  const wrapper = mount(defineComponent({ setup() { feedback = useTaskHoldemFeedback(); return () => null; } }));
  cleanup.push(() => wrapper.unmount());
  if (!feedback) throw new Error("Feedback was not mounted");
  return feedback;
}

function room() {
  return toTaskHoldemRoom({ state: createTaskHoldemState(randomUUID()), revision: 2, changed: true, removedParticipantIds: [] });
}

beforeEach(() => {
  nativeNotification.mockReset();
  const preferences = readTaskHoldemFeedback();
  preferences.notifications = true;
  saveTaskHoldemFeedback(preferences);
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("Notification", class {
    static permission = "granted";
    constructor(title: string, options: NotificationOptions) { nativeNotification(title, options); }
    close() {}
  });
  vi.spyOn(document, "hasFocus").mockReturnValue(false);
  Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
    register: vi.fn().mockRejectedValue(new DOMException("Service workers are blocked", "SecurityError")),
    getRegistration: vi.fn().mockResolvedValue(undefined),
  } });
});

afterEach(() => {
  cleanup.splice(0).forEach(dispose => dispose());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  if (serviceWorkerDescriptor) Object.defineProperty(navigator, "serviceWorker", serviceWorkerDescriptor);
  else Reflect.deleteProperty(navigator, "serviceWorker");
  if (locksDescriptor) Object.defineProperty(navigator, "locks", locksDescriptor);
  else Reflect.deleteProperty(navigator, "locks");
});

describe("Task Hold'em notification delivery", () => {
  test("falls back to desktop notifications when service-worker lookup is blocked", async () => {
    vi.spyOn(navigator.serviceWorker, "getRegistration").mockRejectedValue(new DOMException("Storage access is denied", "SecurityError"));
    const feedback = mountFeedback();
    await feedback.notifyRound(room());
    expect(nativeNotification).toHaveBeenCalledOnce();
    expect(feedback.notificationError.value).toBeNull();
  });

  test.each(["muted", "zero volume", "round sounds disabled"])("keeps browser alerts silent with %s", async (setting) => {
    const feedback = mountFeedback();
    if (setting === "muted") feedback.preferences.muted = true;
    else if (setting === "zero volume") feedback.preferences.volume = 0;
    else feedback.preferences.categories.rounds = false;
    await feedback.notifyRound(room());
    expect(nativeNotification).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ silent: true }));
  });

  test("waits for an installing notification worker instead of calling the mobile-unsupported constructor", async () => {
    class Worker extends EventTarget { state: ServiceWorkerState = "installing"; }
    const worker = new Worker();
    let active: Worker | null = null;
    const showNotification = vi.fn().mockResolvedValue(undefined);
    const registration = { get active() { return active; }, installing: worker, waiting: null, showNotification };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
      register: vi.fn().mockResolvedValue(registration), getRegistration: vi.fn().mockResolvedValue(registration),
    } });
    nativeNotification.mockImplementation(() => { throw new TypeError("Mobile notifications require a service worker"); });
    const feedback = mountFeedback();
    await flushPromises();
    const delivery = feedback.notifyRound(room());
    await flushPromises();
    expect(nativeNotification).not.toHaveBeenCalled();
    worker.state = "activated";
    active = worker;
    worker.dispatchEvent(new Event("statechange"));
    await delivery;
    expect(showNotification).toHaveBeenCalledOnce();
  });

  test("cancels worker activation and removes listeners when the page is disposed", async () => {
    class Worker extends EventTarget { state: ServiceWorkerState = "installing"; }
    const worker = new Worker();
    const removed = vi.spyOn(worker, "removeEventListener");
    const showNotification = vi.fn();
    const registration = { active: null, installing: worker, waiting: null, showNotification };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
      register: vi.fn().mockResolvedValue(registration), getRegistration: vi.fn().mockResolvedValue(registration),
    } });
    const feedback = mountFeedback();
    await flushPromises();
    const delivery = feedback.notifyRound(room());
    await flushPromises();
    cleanup.pop()?.();
    await delivery;
    expect(removed).toHaveBeenCalledWith("statechange", expect.any(Function));
    expect(nativeNotification).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("bounds the wait for an installation that never activates", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    class Worker extends EventTarget { state: ServiceWorkerState = "installing"; }
    const worker = new Worker();
    const removed = vi.spyOn(worker, "removeEventListener");
    const registration = { active: null, installing: worker, waiting: null };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
      register: vi.fn().mockResolvedValue(registration), getRegistration: vi.fn().mockResolvedValue(registration),
    } });
    const feedback = mountFeedback();
    await flushPromises();
    const delivery = feedback.notifyRound(room());
    await flushPromises();
    await vi.advanceTimersByTimeAsync(5000);
    await delivery;
    expect(nativeNotification).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledWith("statechange", expect.any(Function));
  });
});
