import type { WebSocketRoute } from "@playwright/test";
import { expect, test } from "./support/task-holdem";

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Socket admission recovery is covered once.");

test("a failed rejoin keeps the credential and disables commands until admission succeeds", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await createPlayer(roomId, "Observer");
  await alice.vote(13);
  let transport: WebSocketRoute | undefined;
  let rejectJoins = false;
  let syncs = 0;
  await alice.page.routeWebSocket("**/api/websocket/task-holdem/**", (route) => {
    transport = route;
    const server = route.connectToServer();
    server.onMessage(message => route.send(message));
    route.onMessage((message) => {
      if (typeof message === "string") {
        if (message.includes('"room:sync"')) syncs++;
        const command = message.match(/^42(\d+)\["room:join",/);
        if (rejectJoins && command) {
          route.send(`43${command[1]}${JSON.stringify([{ ok: false, error: { code: "UNAVAILABLE", message: "Room admission is temporarily unavailable." } }])}`);
          return;
        }
      }
      server.send(message);
    });
  });
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  const id = await alice.player("Alice").getAttribute("data-participant-id");
  const credential = await alice.page.evaluate(id => localStorage.getItem(`task-holdem:v3:room:${id}`), roomId);
  rejectJoins = true;
  await transport!.close();
  await expect(alice.page.getByRole("alert")).toContainText("Room admission is temporarily unavailable.");
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toBeDisabled();
  const beforeFocus = syncs;
  await alice.page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await alice.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(syncs).toBe(beforeFocus);
  expect(await alice.page.evaluate(id => localStorage.getItem(`task-holdem:v3:room:${id}`), roomId)).toBe(credential);
  rejectJoins = false;
  await alice.page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(alice.player("Alice")).toHaveAttribute("data-participant-id", id!);
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toBeEnabled();
  await expect(alice.page.getByRole("button", { name: "Select 13 card", exact: true })).toHaveAttribute("aria-pressed", "true");
});
