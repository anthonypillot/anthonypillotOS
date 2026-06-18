import { test, expect } from "@playwright/test";
import { application } from "../../../configuration";

test("should display the hero and a Launch TaskHold'em control", async ({ page }) => {
  await page.goto(application.taskHoldemLanding.url);

  await expect(page.getByRole("heading", { name: "TaskHold’em" }).first()).toBeVisible();
  await expect(page.getByTestId("task-holdem-launch")).toBeVisible();
});
