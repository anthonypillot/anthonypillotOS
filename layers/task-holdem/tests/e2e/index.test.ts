import { expect, test } from "../../../../tests/e2e/support/fixtures";
import { routes } from "../../../../tests/e2e/configuration";

test("landing page links to the multiplayer application", async ({ page }) => {
  await page.goto(routes.taskHoldemLanding);
  await expect(page.getByRole("heading", { name: "TaskHold’em", level: 1 })).toBeVisible();
  await expect(page.getByTestId("task-holdem-launch")).toHaveAttribute("href", routes.taskHoldem);
  const logo = page.locator('img[src*="task-holdem/logo.svg"]').first();
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
});

test("layer assets keep their public URLs", async ({ request }) => {
  for (const path of ["/svg/task-holdem/logo.svg", "/svg/task-holdem/logo-light.svg", "/tools/task-holdem/notifications.js"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["content-type"]).toMatch(path.endsWith(".svg") ? /image\/svg\+xml/ : /(?:text|application)\/javascript/);
  }
});
