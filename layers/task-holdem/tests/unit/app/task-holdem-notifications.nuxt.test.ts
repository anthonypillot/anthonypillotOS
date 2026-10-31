import { randomUUID } from "node:crypto";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useTaskHoldemFeedback } from "../../../app/composables/useTaskHoldemFeedback";
import { readTaskHoldemFeedback, saveTaskHoldemFeedback } from "../../../app/utils/task-holdem-feedback";
import { createTaskHoldemState, toTaskHoldemRoom } from "../../../server/domain/room";

const nativeNotification = vi.fn();
const requestPermission = vi.fn<() => Promise<NotificationPermission>>();
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
  requestPermission.mockReset().mockResolvedValue("granted");
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("Notification", class TestNotification {
    static permission: NotificationPermission = "granted";
    static async requestPermission() {
      const result = await requestPermission();
      TestNotification.permission = result;
      return result;
    }
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

  test("keeps browser alerts silent when sound effects are muted", async () => {
    const preferences = readTaskHoldemFeedback();
    preferences.muted = true;
    saveTaskHoldemFeedback(preferences);
    const feedback = mountFeedback();
    await feedback.notifyRound(room());
    expect(nativeNotification).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ silent: true }));
  });

  test("only requests permission when explicitly called and asks at most once per page", async () => {
    Object.defineProperty(Notification, "permission", { configurable: true, writable: true, value: "default" });
    const feedback = mountFeedback();
    await flushPromises();
    expect(requestPermission).not.toHaveBeenCalled();
    await Promise.all([feedback.requestNotifications(), feedback.requestNotifications()]);
    expect(requestPermission).toHaveBeenCalledOnce();
    await feedback.notifyRound(room());
    expect(nativeNotification).toHaveBeenCalledOnce();
  });

  test.each<NotificationPermission>(["granted", "denied"])("does not prompt again when permission is %s", async (permission) => {
    Object.defineProperty(Notification, "permission", { configurable: true, writable: true, value: permission });
    const feedback = mountFeedback();
    await feedback.requestNotifications();
    expect(requestPermission).not.toHaveBeenCalled();
    await feedback.notifyRound(room());
    expect(nativeNotification).toHaveBeenCalledTimes(permission === "granted" ? 1 : 0);
  });

  test("does not prompt again after the permission dialog is dismissed", async () => {
    Object.defineProperty(Notification, "permission", { configurable: true, writable: true, value: "default" });
    requestPermission.mockResolvedValue("default");
    const feedback = mountFeedback();
    await feedback.requestNotifications();
    await feedback.requestNotifications();
    await feedback.notifyRound(room());
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(nativeNotification).not.toHaveBeenCalled();
  });

  test("ignores a permission result received after disposal", async () => {
    Object.defineProperty(Notification, "permission", { configurable: true, writable: true, value: "default" });
    let resolvePermission: ((permission: NotificationPermission) => void) | undefined;
    requestPermission.mockImplementation(() => new Promise((resolve) => { resolvePermission = resolve; }));
    const feedback = mountFeedback();
    const pending = feedback.requestNotifications();
    cleanup.pop()?.();
    resolvePermission?.("granted");
    await pending;
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  test("treats unsupported notifications as optional", async () => {
    vi.stubGlobal("isSecureContext", false);
    const feedback = mountFeedback();
    await feedback.requestNotifications();
    await feedback.notifyRound(room());
    expect(requestPermission).not.toHaveBeenCalled();
    expect(nativeNotification).not.toHaveBeenCalled();
    expect(feedback.notificationError.value).toBeNull();
  });

  test("handles a browser rejecting the permission request without an unhandled failure", async () => {
    Object.defineProperty(Notification, "permission", { configurable: true, writable: true, value: "default" });
    requestPermission.mockRejectedValue(new DOMException("Permission requests are blocked", "NotAllowedError"));
    const feedback = mountFeedback();
    await feedback.requestNotifications();
    expect(feedback.notificationError.value).toBe("Notifications couldn't be enabled in this browser.");
    await feedback.requestNotifications();
    expect(requestPermission).toHaveBeenCalledOnce();
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

  test("cancels delivery when browser permission is revoked while the worker activates", async () => {
    class Worker extends EventTarget { state: ServiceWorkerState = "installing"; }
    const worker = new Worker();
    const showNotification = vi.fn();
    const registration = { active: null, installing: worker, waiting: null, showNotification };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
      register: vi.fn().mockResolvedValue(registration), getRegistration: vi.fn().mockResolvedValue(registration),
    } });
    const feedback = mountFeedback();
    await flushPromises();
    const delivery = feedback.notifyRound(room());
    await flushPromises();
    Object.defineProperty(Notification, "permission", { configurable: true, value: "denied" });
    window.dispatchEvent(new Event("focus"));
    await delivery;
    expect(showNotification).not.toHaveBeenCalled();
    expect(nativeNotification).not.toHaveBeenCalled();
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
