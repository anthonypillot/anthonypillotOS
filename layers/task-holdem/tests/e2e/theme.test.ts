import { expect, test } from "./support/task-holdem";
import { expectReadableContrast } from "../../../../tests/e2e/support/contrast";

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} system appearance`, () => {
    test.use({ colorScheme });

    test("workspace, chat and archived results share readable dark surfaces", async ({ roomId, createPlayer }) => {
      const alice = await createPlayer(roomId, "Alice");
      await alice.openChat();
      await expectReadableContrast(alice.page);
      await alice.page.getByRole("button", { name: /^History/ }).click();
      await expect(alice.page.getByText("Your session story starts here.", { exact: true })).toBeVisible();
      await expectReadableContrast(alice.page);
      await alice.page.keyboard.press("Escape");

      await alice.vote(13);
      await alice.reveal.click();
      await expect(alice.page.getByText("Average: 13", { exact: true })).toBeVisible();
      await expectReadableContrast(alice.page);
      await alice.page.getByRole("button", { name: /^History/ }).click();
      await expect(alice.page.getByRole("heading", { name: "Round 1", exact: true })).toBeVisible();
      await alice.page.getByText("1 vote · View details", { exact: true }).click();
      await expectReadableContrast(alice.page);
    });

    test("feedback uses the shared modal theme and restores keyboard focus", async ({ roomId, createPlayer }) => {
      const alice = await createPlayer(roomId, "Alice");
      const trigger = alice.page.getByRole("button", { name: "Send feedback", exact: true });
      await trigger.click();
      const dialog = alice.page.getByRole("dialog", { name: "Feedback", exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
      await expectReadableContrast(alice.page);
      await alice.page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("feedback errors remain readable and allow a retry without trapping the user", async ({ roomId, createPlayer }) => {
      const alice = await createPlayer(roomId, "Alice");
      let requests = 0;
      await alice.page.route("**/api/form/feedback", async (route) => {
        requests++;
        await route.fulfill({ status: requests === 1 ? 500 : 200, contentType: "application/json", body: "{}" });
      });
      const trigger = alice.page.getByRole("button", { name: "Send feedback", exact: true });
      await trigger.click();
      const dialog = alice.page.getByRole("dialog", { name: "Feedback", exact: true });
      await dialog.getByRole("textbox", { name: /^Feedback/ }).fill("Check the room layout.");
      await dialog.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(dialog.getByRole("alert")).toHaveText("Your feedback couldn't be sent. Please try again.");
      await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeEnabled();
      await expectReadableContrast(alice.page);
      await dialog.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(alice.page.getByRole("dialog", { name: "Thank you!", exact: true })).toBeVisible();
      expect(requests).toBe(2);
      await alice.page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    });
  });
}
