import type { WebSocketRoute } from "@playwright/test";
import { expect, test } from "./support/task-holdem";
import { installTaskHoldemFeedbackMocks } from "./support/task-holdem-feedback";
import { routes } from "../../../../tests/e2e/configuration";

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Browser API behavior is covered once; responsive controls are covered by the page suite.");

test("confirmed votes and messages play once, while mute and category choices persist", async ({ roomId, createPlayer }) => {
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

  await alice.page.getByRole("button", { name: "Sound and notification settings", exact: true }).click();
  await alice.page.getByRole("checkbox", { name: "Chat messages", exact: true }).uncheck();
  await alice.page.getByRole("checkbox", { name: "Sound effects", exact: true }).uncheck();
  await alice.page.keyboard.press("Escape");
  await alice.page.evaluate(() => { window.taskHoldemFeedbackLog.frequencies = []; });
  await alice.vote(21);
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.frequencies)).toEqual([]);
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  await alice.page.getByRole("button", { name: "Sound and notification settings", exact: true }).click();
  await expect(alice.page.getByRole("checkbox", { name: "Sound effects", exact: true })).not.toBeChecked();
  await expect(alice.page.getByRole("checkbox", { name: "Chat messages", exact: true })).not.toBeChecked();
  await expect(alice.page.getByRole("button", { name: "Test sound", exact: true })).toBeDisabled();
});

test("round alerts require explicit consent and only notify in the background", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await installTaskHoldemFeedbackMocks(alice.page);
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(0);
  await alice.page.getByRole("button", { name: "Sound and notification settings", exact: true }).click();
  await alice.page.getByRole("button", { name: "Enable round notifications", exact: true }).click();
  await expect(alice.page.getByRole("checkbox", { name: "Notify about new rounds", exact: true })).toBeChecked();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(1);
  await alice.page.keyboard.press("Escape");
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
  await alice.page.getByRole("button", { name: "Sound and notification settings", exact: true }).click();
  await expect(alice.page.getByText("Notifications aren't available here. New rounds will still appear in the room.", { exact: true })).toBeVisible();
});

test("denied notification permission is explained without prompting again", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await installTaskHoldemFeedbackMocks(alice.page, "denied");
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  await alice.page.getByRole("button", { name: "Sound and notification settings", exact: true }).click();
  await expect(alice.page.getByText(/Notifications are blocked/)).toBeVisible();
  await expect(alice.page.getByRole("button", { name: "Enable round notifications", exact: true })).toBeHidden();
  expect(await alice.page.evaluate(() => window.taskHoldemFeedbackLog.requests)).toBe(0);
  await alice.page.keyboard.press("Escape");
  await alice.vote(3);
  await expect(alice.player("Alice")).toHaveAttribute("data-voted", "true");
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
      await page.getByRole("button", { name: "Sound and notification settings", exact: true }).click();
      await page.getByRole("checkbox", { name: "Notify about new rounds", exact: true }).check();
      await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration("/tools/task-holdem/"))?.active?.state)).toBe("activated");
      await page.keyboard.press("Escape");
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
