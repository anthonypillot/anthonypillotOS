import { expectReadableContrast } from "../../../../tests/e2e/support/contrast";
import { expect, test } from "./support/task-holdem";

test("chat recognizes web links for every player without changing the message", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.openChat();
  await bob.openChat();
  const content = "Discuss (https://docs.example.com/ticket/PROJ-42?view=board#estimate). Then www.example.org/docs and http://example.net/help.";
  await alice.page.getByRole("textbox", { name: "Your message", exact: true }).fill(content);
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  for (const player of [alice, bob]) {
    const body = player.page.getByRole("log", { name: "Room messages", exact: true }).locator(":scope > div > p").last();
    await expect(body.getByRole("link")).toHaveCount(3);
    expect(await body.evaluate(element => element.textContent)).toBe(content);
    expect(await body.getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("href")))).toEqual([
      "https://docs.example.com/ticket/PROJ-42?view=board#estimate", "https://www.example.org/docs", "http://example.net/help",
    ]);
    for (const link of await body.getByRole("link").all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  }
  await expectReadableContrast(bob.page);
});

test("clicking a chat link opens an isolated new tab and keeps the room connected", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const url = "https://docs.example.com/ticket/PROJ-42";
  await alice.page.context().route("https://docs.example.com/**", async route => {
    await route.fulfill({ contentType: "text/html", body: "<!doctype html><html lang='en'><head><title>Linked document</title></head><body><h1>Linked document</h1></body></html>" });
  });
  await alice.openChat();
  await alice.page.getByRole("textbox", { name: "Your message", exact: true }).fill(url);
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  const roomURL = alice.page.url();
  const popupPromise = alice.page.waitForEvent("popup");
  await alice.page.getByRole("log", { name: "Room messages", exact: true }).getByRole("link").click();
  const popup = await popupPromise;
  try {
    await expect(popup.getByRole("heading", { name: "Linked document", exact: true })).toBeVisible();
    await expect(popup).toHaveURL(url);
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    expect(await popup.evaluate(() => document.referrer)).toBe("");
    await expect(alice.page).toHaveURL(roomURL);
    await expect(bob.player("Alice")).toHaveAttribute("data-connected", "true");
  } finally {
    await popup.close();
  }
});

test("chat treats HTML and unsafe protocols as text rather than executable content", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const dialogs: string[] = [];
  alice.page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await alice.openChat();
  const content = '<img src=x onerror="alert(1)"><script>alert(1)</script> javascript:alert(1) data:text/html,unsafe ftp://files.example.com/file https://example.com/safe';
  await alice.page.getByRole("textbox", { name: "Your message", exact: true }).fill(content);
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  const body = alice.page.getByRole("log", { name: "Room messages", exact: true }).locator(":scope > div > p").last();
  await expect(body.getByRole("link")).toHaveCount(1);
  expect(await body.evaluate(element => element.textContent)).toBe(content);
  await expect(body.locator("img, script, iframe, [onerror]")).toHaveCount(0);
  await expect(body.getByRole("link")).toHaveAttribute("href", "https://example.com/safe");
  expect(dialogs).toEqual([]);
});

test("long chat URLs wrap inside the message list on narrow screens", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await alice.openChat();
  const url = `https://example.com/search?q=${"planning-estimate-".repeat(40)}`;
  await alice.page.getByRole("textbox", { name: "Your message", exact: true }).fill(url);
  await alice.page.getByRole("button", { name: "Send", exact: true }).click();
  const log = alice.page.getByRole("log", { name: "Room messages", exact: true });
  await expect(log.getByRole("link")).toHaveAttribute("href", url);
  await expect(log.getByRole("link")).toHaveCSS("word-break", "break-all");
  expect(await log.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
