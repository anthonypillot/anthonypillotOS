import type { Page } from "@playwright/test";

type FeedbackLog = {
  frequencies: number[];
  notifications: { title: string; options: NotificationOptions }[];
  requests: number;
  closed: number;
  audioContexts: number;
  audioClosed: number;
  hidden: boolean;
  failNotification: boolean;
};

declare global {
  interface Window { taskHoldemFeedbackLog: FeedbackLog }
}

export async function installTaskHoldemFeedbackMocks(page: Page, permission: NotificationPermission = "default"): Promise<void> {
  await page.addInitScript((initialPermission) => {
    const log: FeedbackLog = { frequencies: [], notifications: [], requests: 0, closed: 0, audioContexts: 0, audioClosed: 0, hidden: false, failNotification: false };
    window.taskHoldemFeedbackLog = log;
    class TestOscillator {
      frequency = { value: 0 };
      type = "sine";
      onended: (() => void) | null = null;
      connect() {}
      disconnect() {}
      start() { log.frequencies.push(this.frequency.value); }
      stop() { queueMicrotask(() => this.onended?.()); }
    }
    class TestAudioContext {
      state = "suspended";
      currentTime = 0;
      destination = {};
      constructor() { log.audioContexts++; }
      async resume() { this.state = "running"; }
      async close() { this.state = "closed"; log.audioClosed++; }
      createGain() {
        return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
      }
      createOscillator() { return new TestOscillator(); }
    }
    class TestNotification {
      static permission = initialPermission;
      static async requestPermission() { log.requests++; this.permission = "granted"; return this.permission; }
      onclick: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onerror: (() => void) | null = null;
      tag: string;
      constructor(title: string, options: NotificationOptions = {}) {
        if (log.failNotification) throw new Error("Notifications unavailable");
        this.tag = options.tag ?? "";
        log.notifications.push({ title, options });
      }
      close() { log.closed++; this.onclose?.(); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: TestAudioContext });
    Object.defineProperty(window, "Notification", { configurable: true, value: TestNotification });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { async getRegistration() { return undefined; }, async register() { throw new Error("Service workers disabled in this test"); } },
    });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => log.hidden ? "hidden" : "visible" });
    document.hasFocus = () => !log.hidden;
  }, permission);
}
