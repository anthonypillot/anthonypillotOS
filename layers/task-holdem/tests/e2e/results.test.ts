import { expect, test } from "./support/fixtures";

test("revealed distributions group numeric and special cards without exposing them early", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const charlie = await createPlayer(roomId, "Charlie");
  const dana = await createPlayer(roomId, "Dana");
  await alice.vote(8);
  await bob.vote(8);
  await charlie.vote("skip");
  await dana.vote("break");
  const distribution = alice.page.getByRole("region", { name: "Vote distribution", exact: true });
  await expect(distribution).toHaveCount(0);
  await alice.revealCards();
  await expect(alice.page.getByText("Votes are locked for this round.", { exact: true })).toBeVisible();
  await expect(distribution).toHaveCount(0);
  await expect(alice.page.getByText("Average: 8", { exact: true })).toBeVisible();
  await expect(distribution).toContainText("4 votes cast · 2 numeric · 1 Pass · 1 Unsure");
  await expect(distribution.getByRole("listitem")).toHaveCount(3);
  await expect(distribution.getByRole("listitem").nth(0)).toHaveAttribute("aria-label", "8: 2 votes");
  await expect(distribution.getByRole("listitem").nth(1)).toHaveAttribute("aria-label", "Pass: 1 vote");
  await expect(distribution.getByRole("listitem").nth(2)).toHaveAttribute("aria-label", "Unsure: 1 vote");
  await bob.page.getByRole("button", { name: "Leave room", exact: true }).click();
  await expect(alice.player("Bob")).toHaveCount(0);
  await expect(distribution).toContainText("4 votes cast · 2 numeric · 1 Pass · 1 Unsure");
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await alice.restart.click();
  await expect(distribution).toHaveCount(0);
});

test("special-only distributions keep the numeric average unavailable", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  await alice.vote("break");
  await bob.vote("skip");
  await alice.revealCards();
  await expect(alice.page.getByText("Average: N/A", { exact: true })).toBeVisible();
  await expect(alice.page.getByRole("region", { name: "Vote distribution", exact: true })).toContainText("2 votes cast · 0 numeric · 1 Pass · 1 Unsure");
});
