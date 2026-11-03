import { expect, test } from "./support/fixtures";

test("closed chat counts other players' unread messages and opening the visible log marks them read", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await bob.openChat();
  const message = bob.page.getByRole("textbox", { name: "Your message", exact: true });
  await message.fill("A new message for Alice");
  await bob.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(bob.page.getByTestId("chat-message-count")).toHaveCount(0);
  await expect(alice.page.getByTestId("chat-message-count")).toContainText("1 unread message");
  await alice.page.bringToFront();
  await alice.openChat();
  await alice.page.getByRole("log", { name: "Room messages", exact: true }).scrollIntoViewIfNeeded();
  await expect(alice.page.getByTestId("chat-message-count")).toHaveCount(0);
  await alice.page.getByRole("button", { name: "Close chat", exact: true }).click();
  await expect(alice.page.getByTestId("chat-message-count")).toHaveCount(0);
});

test("new messages preserve an older reading position until the reader asks for the latest", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await bob.openChat();
  for (let index = 0; index < 8; index++) {
    await bob.page.getByRole("textbox", { name: "Your message", exact: true }).fill(`Message ${index}: ${"Discussion details. ".repeat(10)}`);
    await bob.page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(bob.page.getByRole("textbox", { name: "Your message", exact: true })).toBeEmpty();
  }
  await alice.page.bringToFront();
  await alice.openChat();
  const log = alice.page.getByRole("log", { name: "Room messages", exact: true });
  await log.scrollIntoViewIfNeeded();
  await expect(alice.page.getByTestId("chat-message-count")).toHaveCount(0);
  await log.evaluate(element => { element.scrollTop = 0; element.dispatchEvent(new Event("scroll")); });
  await bob.page.getByRole("textbox", { name: "Your message", exact: true }).fill("The latest message");
  await bob.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(log).toContainText("The latest message");
  expect(await log.evaluate(element => element.scrollTop)).toBe(0);
  await expect(alice.page.getByTestId("chat-message-count")).toContainText("1 unread message");
  await alice.page.bringToFront();
  await alice.page.getByRole("button", { name: "Show new messages", exact: true }).click();
  await expect(alice.page.getByTestId("chat-message-count")).toHaveCount(0);
  await expect.poll(() => log.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(16);
});
