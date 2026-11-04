import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";

async function prepareVisibleAvatars(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const avatar of await page.locator("main header [data-mascot], [data-testid='card-companion'] [data-mascot], aside [data-mascot]").all()) {
    await expect(avatar).toHaveAttribute("data-running", "true");
  }
  await page.clock.pauseAt(new Date(Date.now() + 1000));
}

async function expectOwnReaction(page: Page, name: string, motion: string): Promise<void> {
  await expect(page.getByTestId("card-companion").locator("[data-mascot]")).toHaveAttribute("data-motion", motion);
  await expect(page.getByRole("group", { name, exact: true }).locator("[data-mascot]")).toHaveAttribute("data-motion", motion);
}

test("player-list greetings mirror the personal companion and profile with a shared cooldown", async ({ roomId, createPlayer, isMobile }) => {
  test.skip(isMobile, "Desktop shows all three avatar locations together; mobile separately exercises an offscreen companion.");
  const alice = await createPlayer(roomId, "Alice", "robot");
  await prepareVisibleAvatars(alice.page);
  const hello = alice.player("Alice").getByRole("button", { name: "Say hello to Alice", exact: true });
  const profile = alice.page.locator("main header [data-mascot]");
  await hello.focus();
  await alice.page.keyboard.press("Space");
  await expectOwnReaction(alice.page, "Alice", "moonwalk");
  await expect(profile).toHaveAttribute("data-motion", "moonwalk");
  await expect(hello).toBeFocused();
  await expect(alice.player("Alice")).toHaveAttribute("data-voted", "false");
  await alice.page.clock.runFor(1800);
  await alice.page.getByRole("button", { name: "Say hello to your Robot", exact: true }).click();
  await expectOwnReaction(alice.page, "Alice", "rest");
  await expect(profile).toHaveAttribute("data-motion", "rest");
  await alice.page.clock.runFor(6200);
  await alice.page.getByRole("button", { name: "Say hello to your Robot", exact: true }).click();
  await expectOwnReaction(alice.page, "Alice", "moonwalk");
  await expect(profile).toHaveAttribute("data-motion", "moonwalk");
  await alice.page.emulateMedia({ reducedMotion: "reduce" });
  await expectOwnReaction(alice.page, "Alice", "rest");
  await expect(profile).toHaveAttribute("data-motion", "rest");
});

test("votes, clears, reveals and new rounds animate player avatars without exposing private choices", async ({ roomId, createPlayer, isMobile }) => {
  test.skip(isMobile, "Desktop displays the deck and player list simultaneously; touch-only layout behavior is covered separately.");
  const alice = await createPlayer(roomId, "Alice", "robot");
  const bob = await createPlayer(roomId, "Bob", "doctor");
  await prepareVisibleAvatars(alice.page);
  await prepareVisibleAvatars(bob.page);
  const observedAlice = bob.player("Alice").locator("[data-mascot]");
  await alice.vote("break");
  await expectOwnReaction(alice.page, "Alice", "think");
  await expect(observedAlice).toHaveAttribute("data-motion", "vote");
  await expect(bob.player("Alice")).not.toContainText("Unsure");
  await bob.page.clock.runFor(680);
  await alice.vote("skip");
  await expectOwnReaction(alice.page, "Alice", "break");
  await expect(observedAlice).toHaveAttribute("data-motion", "rest");
  await expect(bob.player("Alice")).not.toContainText("Pass");
  await alice.page.getByRole("button", { name: "Select skip card", exact: true }).click();
  await expect(alice.page.getByRole("button", { name: "Select skip card", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expectOwnReaction(alice.page, "Alice", "glance");
  await expect(observedAlice).toHaveAttribute("data-motion", "glance");
  await alice.vote(8);
  await bob.vote(13);
  await alice.revealCards();
  await expect(alice.page.getByText("Average: 10.5", { exact: true })).toBeVisible();
  await expectOwnReaction(alice.page, "Alice", "reveal");
  await expectOwnReaction(bob.page, "Bob", "reveal");
  await expect(alice.player("Bob").locator("[data-mascot]")).toHaveAttribute("data-motion", "reveal");
  await expect(observedAlice).toHaveAttribute("data-motion", "reveal");
  await alice.restart.click();
  await expect(alice.reveal).toBeDisabled();
  await expectOwnReaction(alice.page, "Alice", "signature");
  await expectOwnReaction(bob.page, "Bob", "signature");
  await expect(alice.player("Bob").locator("[data-mascot]")).toHaveAttribute("data-motion", "signature");
  await expect(observedAlice).toHaveAttribute("data-motion", "signature");
});
