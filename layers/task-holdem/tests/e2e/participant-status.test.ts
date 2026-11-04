import { routes } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/fixtures";

test("lattice status follows confirmed votes without exposing unrevealed values", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const ownStatus = alice.player("Alice").getByRole("status");
  const sharedStatus = bob.player("Alice").getByRole("status");
  await expect(sharedStatus).toHaveAttribute("data-status", "working");
  await expect(ownStatus.locator(".lattice-grid")).toHaveCSS("width", "13px");
  await expect(ownStatus.locator(".lattice-run .lattice-cell").first()).toHaveCSS("animation-name", "none");
  await expect(alice.player("Alice").locator(".iconify")).toHaveCount(0);
  await alice.page.evaluate(() => document.fonts.ready);
  const initial = await alice.player("Alice").boundingBox();
  await alice.vote(13);
  await expect(sharedStatus).toHaveAttribute("data-status", "done");
  await expect(sharedStatus).toContainText("Alice: Vote is in");
  await expect(bob.player("Alice").getByText("13", { exact: true })).toHaveCount(0);
  expect((await alice.player("Alice").boundingBox())!.height).toBeCloseTo(initial!.height, 0);
  await alice.page.getByRole("button", { name: "Select 13 card", exact: true }).click();
  await expect(sharedStatus).toHaveAttribute("data-status", "working");
  await alice.vote(13);
  await alice.revealCards();
  await expect(bob.player("Bob").getByText("No vote", { exact: true })).toBeVisible();
  await expect(bob.player("Bob").getByRole("status")).toHaveCount(0);
  await expect(alice.page.getByText("Average: 13", { exact: true })).toBeVisible();
  await expect(bob.player("Alice").getByText("13", { exact: true })).toBeVisible();
  await alice.restart.click();
  await expect(sharedStatus).toHaveAttribute("data-status", "working");
  await expect(bob.player("Alice").getByText("13", { exact: true })).toHaveCount(0);
});

test("a reconnecting participant uses the connection message instead of a loader", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  const bob = await createPlayer(roomId, "Bob");
  const context = bob.page.context();
  await expect(alice.player("Bob").getByRole("status")).toHaveAttribute("data-status", "working");
  await bob.page.close();
  await expect(alice.player("Bob")).toHaveAttribute("data-connected", "false");
  await expect(alice.player("Bob").getByRole("status")).toHaveCount(0);
  await expect(alice.player("Bob").getByText("Reconnecting…", { exact: true })).toBeVisible();
  const restored = await context.newPage();
  await restored.goto(`${routes.taskHoldem}?id=${roomId}`);
  await expect(alice.player("Bob")).toHaveAttribute("data-connected", "true");
  await expect(alice.player("Bob").getByRole("status")).toHaveAttribute("data-status", "working");
});

test("the working lattice animates only while visible and respects reduced motion", async ({ roomId, createPlayer, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || isMobile, "Exercise real animation lifecycle once; every project verifies the static reduced-motion state.");
  const alice = await createPlayer(roomId, "Alice");
  const status = alice.player("Alice").getByRole("status");
  const cell = status.locator(".lattice-run .lattice-cell").first();
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  await status.scrollIntoViewIfNeeded();
  await expect(status).toHaveAttribute("data-running", "true");
  await expect(cell).toHaveCSS("animation-play-state", "running");
  const opacity = await cell.evaluate(element => getComputedStyle(element).opacity);
  await expect.poll(() => cell.evaluate(element => getComputedStyle(element).opacity)).not.toBe(opacity);
  await alice.page.emulateMedia({ reducedMotion: "reduce" });
  await expect(cell).toHaveCSS("animation-name", "none");
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  await alice.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(status).toHaveAttribute("data-running", "false");
  await expect(cell).toHaveCSS("animation-play-state", "paused");
  await status.scrollIntoViewIfNeeded();
  await expect(status).toHaveAttribute("data-running", "true");
});
