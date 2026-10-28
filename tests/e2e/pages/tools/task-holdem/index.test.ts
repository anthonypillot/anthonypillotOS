import { expect, test } from "../../../support/fixtures";
import { routes } from "../../../configuration";

test("landing page links to the multiplayer application", async ({ page }) => {
  await page.goto(routes.taskHoldemLanding);
  await expect(page.getByRole("heading", { name: "TaskHold’em", level: 1 })).toBeVisible();
  await expect(page.getByTestId("task-holdem-launch")).toHaveAttribute("href", routes.taskHoldem);
});
