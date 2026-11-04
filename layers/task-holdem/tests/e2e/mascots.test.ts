import { routes } from "../../../../tests/e2e/configuration";
import { taskHoldemMascots } from "../../shared/data/mascots";
import { expect, test } from "./support/fixtures";

test("hidden table companions stay in the bottom-right corner clear of round content", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await alice.page.evaluate(() => document.fonts.ready);
  const panel = alice.page.getByRole("region", { name: "Current round", exact: true });

  async function expectCorner(): Promise<void> {
    const layout = await panel.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const mascot = element.querySelector("[data-testid='table-companion']")?.getBoundingClientRect();
      if (!mascot) throw new Error("The table companion is missing");
      const overlaps = [...element.querySelectorAll("h2, h3, p, button, ul")].filter((content) => {
        const box = content.getBoundingClientRect();
        return box.left < mascot.right && box.right > mascot.left && box.top < mascot.bottom && box.bottom > mascot.top;
      }).map(content => content.textContent);
      return { bottom: bounds.bottom - mascot.bottom, right: bounds.right - mascot.right, overlaps };
    });
    expect(layout.bottom).toBeCloseTo(8, 0);
    expect(layout.right).toBeCloseTo((alice.page.viewportSize()?.width ?? 0) < 640 ? 12 : 20, 0);
    expect(layout.overlaps).toEqual([]);
  }

  await expectCorner();
  await alice.vote(8);
  await alice.revealCards();
  await expect(panel.getByText("Average: 8", { exact: true })).toBeVisible();
  await expectCorner();
  await alice.restart.click();
  await expect(alice.reveal).toBeDisabled();
  await expectCorner();
});

test("all six characters greet their selection with an individual pixel-art gesture", async ({ page, roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  try {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${routes.taskHoldem}?id=${roomId}`);
    const picker = page.getByRole("group", { name: "Choose your character", exact: true });
    const avatars = ["officer", "firefighter", "princess", "doctor", "robot", "cowboy"] satisfies (keyof typeof taskHoldemMascots)[];
    for (const avatar of avatars) {
      const option = picker.getByRole("radio", { name: taskHoldemMascots[avatar].name, exact: true });
      const mascot = option.locator("..").locator(`[data-mascot="${avatar}"]`);
      await option.scrollIntoViewIfNeeded();
      await expect(mascot).toHaveAttribute("data-running", "true");
      await option.check();
      await expect(option).toBeChecked();
      await expect(mascot).toHaveAttribute("data-motion", "signature");
      await expect(mascot).toHaveAttribute("data-pose", /gesture|flourish/u);
      await expect(picker.getByRole("radio", { checked: true })).toHaveCount(1);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const mascot of await picker.locator("[data-mascot]").all()) {
      await expect(mascot).toHaveAttribute("data-pose", "rest");
      await expect(mascot).toHaveAttribute("data-running", "false");
    }
  } finally {
    await page.close();
  }
});

test("the personal companion reacts to confirmed special cards without exposing them to teammates", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice", "robot");
  const bob = await createPlayer(roomId, "Bob", "doctor");
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  const companion = alice.page.getByTestId("card-companion");
  const mascot = companion.locator("[data-mascot]");
  await companion.scrollIntoViewIfNeeded();
  await expect(mascot).toHaveAttribute("data-running", "true");
  await alice.vote("break");
  await expect(mascot).toHaveAttribute("data-motion", "think");
  await expect(companion.getByTestId("companion-speech")).toHaveText("Dude... I don't know!");
  await expect(bob.page.getByTestId("card-companion").getByTestId("companion-speech")).toHaveCount(0);
  await expect(bob.player("Alice")).toHaveAttribute("data-voted", "true");
  await expect(bob.player("Alice")).not.toContainText("Unsure");
  await alice.vote("skip");
  await expect(mascot).toHaveAttribute("data-motion", "break");
  await expect(mascot).toHaveAttribute("data-pose", "sip");
  await expect(companion.getByTestId("companion-speech")).toHaveText("A tiny coffee break.");
  await alice.page.evaluate(() => localStorage.setItem("task-holdem:v3:profile", JSON.stringify({ name: "A different room profile", avatar: "princess" })));
  await alice.page.reload();
  await expect(alice.player("Alice")).toBeVisible();
  await alice.page.getByTestId("card-companion").scrollIntoViewIfNeeded();
  await expect(mascot).toHaveAttribute("data-mascot", "robot");
  await expect(alice.page.getByRole("button", { name: "Say hello to your Robot", exact: true })).toBeVisible();
  await expect(mascot).toHaveAttribute("data-motion", "rest");
  await expect(alice.page.getByRole("button", { name: "Select skip card", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("the robot's secret is keyboard-activated without voting or moving card targets", async ({ roomId, createPlayer, isMobile }) => {
  test.skip(isMobile, "Keyboard activation is exercised on desktop; touch targets have their own mobile scenario.");
  const alice = await createPlayer(roomId, "Alice", "robot");
  await alice.page.emulateMedia({ reducedMotion: "no-preference" });
  const hello = alice.page.getByRole("button", { name: "Say hello to your Robot", exact: true });
  const mascot = hello.locator("[data-mascot]");
  await hello.scrollIntoViewIfNeeded();
  await expect(mascot).toHaveAttribute("data-running", "true");
  const cards = alice.page.getByTestId("vote-card-grid");
  const before = await cards.boundingBox();
  await hello.focus();
  await alice.page.keyboard.press("Enter");
  await expect(mascot).toHaveAttribute("data-motion", "moonwalk");
  await expect(hello).toBeFocused();
  expect(await cards.boundingBox()).toEqual(before);
  await expect(alice.player("Alice")).toHaveAttribute("data-voted", "false");
  await expect(cards.getByRole("button", { pressed: true })).toHaveCount(0);
  await alice.page.emulateMedia({ reducedMotion: "reduce" });
  await expect(mascot).toHaveAttribute("data-motion", "rest");
  await expect(mascot).toHaveCSS("animation-name", "none");
});

for (const { random, appearance, avatar } of [{ random: 0, appearance: "peek", avatar: "cowboy" }, { random: 0.5, appearance: "card", avatar: "princess" }, { random: 0.99, appearance: "moonwalk", avatar: "robot" }]) {
  test(`the rare ${appearance} appearance stays decorative and stops for reduced motion`, async ({ roomId, createPlayer, browserName, isMobile }) => {
    test.skip(browserName !== "chromium" || isMobile, "Exercise timed, shared-stage choreography once; all devices cover the controls and touch layout.");
    const alice = await createPlayer(roomId, "Alice");
    await alice.page.clock.install();
    await alice.page.addInitScript((value) => { Math.random = () => value; }, random);
    await alice.page.reload();
    await expect(alice.player("Alice")).toBeVisible();
    const table = alice.page.getByTestId("table-companion");
    await table.scrollIntoViewIfNeeded();
    await alice.page.clock.pauseAt(new Date(Date.now() + 1000));
    await alice.page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(table).toHaveAttribute("data-running", "true");
    await alice.page.clock.runFor(20_000 + random * 15_000 + 1);
    await expect(table).toHaveAttribute("data-appearance", appearance);
    await expect(table.locator("[data-mascot]")).toHaveAttribute("data-mascot", avatar);
    await expect(table).toHaveAttribute("aria-hidden", "true");
    await expect(table.locator("a, button, [tabindex], [aria-live]")).toHaveCount(0);
    await expect(alice.page.getByTestId("reveal-button")).toBeDisabled();
    await alice.page.emulateMedia({ reducedMotion: "reduce" });
    await expect(table).toHaveAttribute("data-appearance", "none");
    await expect(table.locator("[data-mascot]")).toHaveAttribute("data-pose", "rest");
  });
}
