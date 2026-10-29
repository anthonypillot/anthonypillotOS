import { expect, test } from "../support/fixtures";

test("unknown routes return HTTP 404 and offer recovery to the home page", async ({ page }) => {
  const path = "/e2e-page-that-does-not-exist";
  const response = await page.goto(path);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Error 404", exact: true })).toBeVisible();
  await expect(page.getByText(path, { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Back to home page", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("navigation", { name: "Global", exact: true })).toBeVisible();
});
