import { expectReadableContrast } from "../../../../tests/e2e/support/contrast";
import { expect, test } from "./support/fixtures";

test("partial reveal can be cancelled with the keyboard or explicitly confirmed", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await createPlayer(roomId, "Bob");
  await alice.vote(8);
  await alice.reveal.click();
  const dialog = alice.page.getByRole("dialog", { name: "Reveal before everyone votes?", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("list", { name: "Players without a vote" })).toHaveText("Bob");
  await expect(dialog.getByRole("button", { name: "Keep voting", exact: true })).toBeFocused();
  await expectReadableContrast(alice.page);
  await alice.page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(alice.reveal).toBeFocused();
  await expect(alice.page.getByRole("button", { name: "Select 8 card", exact: true })).toBeEnabled();
  await alice.reveal.click();
  await dialog.getByRole("button", { name: "Reveal anyway", exact: true }).click();
  await expect(alice.page.getByText("Average: 8", { exact: true })).toBeVisible();
});

test("late votes update the dialog without revealing automatically and special cards count as ready", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.vote("skip");
  await alice.reveal.click();
  const dialog = alice.page.getByRole("dialog", { name: "Reveal before everyone votes?", exact: true });
  await expect(dialog).toContainText("Bob");
  await bob.vote("break");
  await expect(dialog).toContainText("Everyone has now voted");
  await expect(alice.page.getByText("Result", { exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Keep voting", exact: true }).click();
  await alice.reveal.click();
  await expect(dialog).toBeHidden();
  await expect(alice.page.getByText("Average: N/A", { exact: true })).toBeVisible();
});

test("a reconnecting seat is included until its grace period expires", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.vote(5);
  await bob.page.close();
  await expect(alice.player("Bob")).toHaveAttribute("data-connected", "false");
  await alice.reveal.click();
  const dialog = alice.page.getByRole("dialog", { name: "Reveal before everyone votes?", exact: true });
  await expect(dialog).toContainText("BobReconnecting…");
  await expect(dialog).toContainText("Everyone has now voted");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reveal cards now", exact: true }).click();
  await expect(alice.page.getByText("Average: 5", { exact: true })).toBeVisible();
});

test("another player's reveal closes an obsolete confirmation before the next round", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.vote(13);
  await alice.reveal.click();
  const dialog = alice.page.getByRole("dialog", { name: "Reveal before everyone votes?", exact: true });
  await expect(dialog).toBeVisible();
  await bob.revealCards();
  await expect(dialog).toBeHidden();
  await expect(bob.page.getByText("Average: 13", { exact: true })).toBeVisible();
  await bob.restart.click();
  await expect(alice.page.getByRole("heading", { name: "Round 2", exact: true })).toBeVisible();
  await expect(alice.reveal).toBeDisabled();
  await expect(dialog).toBeHidden();
});
