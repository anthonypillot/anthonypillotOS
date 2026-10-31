import type { WebSocketRoute } from "@playwright/test";
import { expect, test, TaskHoldemPage } from "./support/task-holdem";
import { installTaskHoldemFeedbackMocks } from "./support/task-holdem-feedback";
import { routes } from "../../../../tests/e2e/configuration";

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Browser API behavior is covered once; responsive controls are covered by the page suite.");

test.afterEach(async ({ page }) => { await page.close(); });

test("confirmed sounds play once and the single sound toggle persists", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  let browserSocket: WebSocketRoute | undefined;
  let chatFrame: string | undefined;
  await alice.page.routeWebSocket("**/api/websocket/task-holdem/**", (route) => {
    browserSocket = route;
    const server = route.connectToServer();
    server.onMessage((message) => {
      if (typeof message === "string" && message.startsWith('42["chat:message"')) chatFrame = message;
      route.send(message);
    });
  });
  await installTaskHoldemFeedbackMocks(alice.page);
  await alice.page.evaluate(() => localStorage.setItem("task-holdem:feedback:v1", JSON.stringify({
    muted: false, volume: 0, notifications: false,
    categories: { actions: false, votes: false, messages: false, rounds: false, presence: false },
  })));
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.audioContexts)).toBe(0);
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([]);
  await alice.vote(8);
  await expect.poll(() => alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([660, 880]);
  await alice.page.evaluate(() => { window.taskHoldemFeedbackLog.frequencies = []; });
  await bob.vote(13);
  await expect.poll(() => alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([740]);
  await alice.openChat();
  await alice.page.evaluate(() => { window.taskHoldemFeedbackLog.frequencies = []; });
  await alice.page.getByPlaceholder("Your message", { exact: true }).fill("Ready to reveal?");
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([520, 780]);
  expect(chatFrame).toBeTruthy();
  browserSocket!.send(chatFrame!);
  await alice.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([520, 780]);

  const sound = alice.page.getByRole("button", { name: "Sound effects", exact: true });
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await alice.page.evaluate(() => { window.taskHoldemFeedbackLog.frequencies = []; });
  await alice.vote(21);
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([]);
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  expect(await alice.page.evaluate(() => JSON.parse(localStorage.getItem("task-holdem:feedback:v1")!))).toEqual({ muted: true });
  await sound.focus();
  await alice.page.keyboard.press("Space");
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await alice.vote(34);
  await expect.poll(() => alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([660, 880]);
});

test("joining requests native permission from the user gesture and only alerts in the background", async ({ page, roomId, createPlayer }) => {
  const bob = await createPlayer(roomId, "Bob");
  const alice = new TaskHoldemPage(page);
  await installTaskHoldemFeedbackMocks(page);
  await page.goto(`${routes.taskHoldem}?id=${roomId}`);
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(0);
  await page.getByPlaceholder("Your name", { exact: true }).fill("Alice");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await expect(alice.player("Alice")).toBeVisible();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(1);
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.requestHadActivation)).toBe(true);
  await bob.vote(8);
  await bob.reveal.click();
  await expect(alice.page.getByText("Average: 8", { exact: true })).toBeVisible();
  await alice.page.evaluate(() => { window.taskHoldemFeedbackLog.hidden = true; });
  await bob.restart.click();
  await expect.poll(() => alice.page.evaluate(() => window.taskHoldemFeedbackLog.notifications.length)).toBe(1);
  const notification = await alice.page.evaluate(() => window.taskHoldemFeedbackLog.notifications[0]);
  expect(notification?.title).toBe("TaskHold’em · Round 2");
  expect(notification?.options.data.url).toContain(`id=${roomId}`);
  await alice.page.evaluate(() => {
    window.taskHoldemFeedbackLog.hidden = false;
    window.dispatchEvent(new Event("focus"));
  });
  await expect.poll(() => alice.page.evaluate(() => window.taskHoldemFeedbackLog.closed)).toBe(1);
  await bob.vote(5);
  await bob.reveal.click();
  await expect(alice.page.getByText("Average: 5", { exact: true })).toBeVisible();
  await bob.restart.click();
  await expect(alice.page.getByRole("heading", { name: "Round 3", exact: true })).toBeVisible();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.notifications.length)).toBe(1);

  await bob.vote(13);
  await bob.reveal.click();
  await expect(alice.page.getByText("Average: 13", { exact: true })).toBeVisible();
  await alice.page.evaluate(() => { window.taskHoldemFeedbackLog.hidden = true; window.taskHoldemFeedbackLog.failNotification = true; });
  await bob.restart.click();
  await expect(alice.page.getByRole("heading", { name: "Round 4", exact: true })).toBeVisible();
  await expect(alice.page.getByText("Notifications aren't available here. New rounds will still appear in the room.", { exact: true })).toBeVisible();
});

test("denied notification permission does not prompt again or block joining", async ({ page, roomId, createPlayer }) => {
  await createPlayer(roomId, "Bob");
  await installTaskHoldemFeedbackMocks(page, "denied");
  const alice = new TaskHoldemPage(page);
  await alice.join(roomId, "Alice");
  await expect(alice.player("Alice")).toBeVisible();
  await expect(alice.page.getByRole("button", { name: "Enable round notifications", exact: true })).toBeHidden();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(0);
  await alice.vote(3);
  await expect(alice.player("Alice")).toHaveAttribute("data-voted", "true");
});

test("dismissing permission still joins and automatic readmission never prompts", async ({ page, roomId, createPlayer }) => {
  const bob = await createPlayer(roomId, "Bob");
  await installTaskHoldemFeedbackMocks(page, "default", "default");
  const alice = new TaskHoldemPage(page);
  await alice.join(roomId, "Alice");
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(1);
  await page.evaluate(() => { window.taskHoldemFeedbackLog.hidden = true; });
  await bob.vote(8);
  await bob.reveal.click();
  await expect(page.getByText("Average: 8", { exact: true })).toBeVisible();
  await bob.restart.click();
  await expect(page.getByRole("heading", { name: "Round 2", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.notifications)).toEqual([]);
  await page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(0);
});

test("an unanswered permission dialog never blocks room admission", async ({ page, roomId, createPlayer }) => {
  await createPlayer(roomId, "Bob");
  await installTaskHoldemFeedbackMocks(page);
  await page.addInitScript(() => {
    Notification.requestPermission = () => new Promise<NotificationPermission>(() => {});
  });
  const alice = new TaskHoldemPage(page);
  await alice.join(roomId, "Alice");
  await alice.vote(5);
  await expect(alice.player("Alice")).toHaveAttribute("data-voted", "true");
});

test("existing browser permission enables alerts without another application preference", async ({ page, roomId, createPlayer }) => {
  const bob = await createPlayer(roomId, "Bob");
  await installTaskHoldemFeedbackMocks(page, "granted");
  const alice = new TaskHoldemPage(page);
  await alice.join(roomId, "Alice");
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(0);
  await page.getByRole("button", { name: "Sound effects", exact: true }).click();
  await page.evaluate(() => { window.taskHoldemFeedbackLog.hidden = true; });
  await bob.vote(8);
  await bob.reveal.click();
  await expect(page.getByText("Average: 8", { exact: true })).toBeVisible();
  await bob.restart.click();
  await expect.poll(() => page.evaluate(() => window.taskHoldemFeedbackLog.notifications.length)).toBe(1);
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.notifications[0]?.options.silent)).toBe(true);
  await page.getByRole("button", { name: "Leave room", exact: true }).click();
  await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.taskHoldemFeedbackLog.closed)).toBe(1);
  await bob.vote(5);
  await bob.reveal.click();
  await expect(bob.page.getByText("Average: 5", { exact: true })).toBeVisible();
  await bob.restart.click();
  await expect(bob.page.getByRole("heading", { name: "Round 3", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.taskHoldemFeedbackLog.notifications.length)).toBe(1);
});

test.describe("native notification delivery", () => {
  test.use({ serviceWorkers: "allow" });

  test("the notification worker is scoped to the tool without caching or push subscriptions", async ({ page }) => {
    await page.goto(routes.taskHoldem);
    const worker = await page.evaluate(async () => {
      await navigator.serviceWorker.register("/tools/task-holdem/notifications.js", { scope: "/tools/task-holdem/" });
      const registration = await navigator.serviceWorker.ready;
      return {
        scope: new URL(registration.scope).pathname,
        script: new URL(registration.active!.scriptURL).pathname,
        caches: await caches.keys(),
        subscription: await registration.pushManager.getSubscription(),
      };
    });
    expect(worker).toEqual({ scope: "/tools/task-holdem/", script: "/tools/task-holdem/notifications.js", caches: [], subscription: null });
  });

  test("uses a scoped notification-only service worker with the real browser API", async ({ page, roomId, createPlayer }) => {
    const bob = await createPlayer(roomId, "Bob");
    await page.context().grantPermissions(["notifications"]);
    try {
      await page.goto(`${routes.taskHoldem}?id=${roomId}`);
      test.skip(await page.evaluate(() => Notification.permission !== "granted"), "This headless browser denies native notification delivery despite Playwright's permission override.");
      await page.getByPlaceholder("Your name", { exact: true }).fill("Alice");
      await page.getByRole("button", { name: "Join game", exact: true }).click();
      await expect(page.getByRole("group", { name: "Alice", exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration("/tools/task-holdem/"))?.active?.state)).toBe("activated");
      await bob.vote(8);
      await bob.reveal.click();
      await expect(bob.page.getByText("Average: 8", { exact: true })).toBeVisible();
      await page.evaluate(() => { document.hasFocus = () => false; });
      await bob.restart.click();
      await expect.poll(() => page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration("/tools/task-holdem/");
        return (await registration?.getNotifications())?.map(notification => notification.title);
      })).toEqual(["TaskHold’em · Round 2"]);
    } finally {
      await page.close();
    }
  });
});
