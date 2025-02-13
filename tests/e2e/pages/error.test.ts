import { currentUrl } from "@/tests/e2e/configuration";
import { expect, test } from "@playwright/test";

const path = "/something-that-does-not-exist";

test("should have the error message and the error status code", async ({ page }) => {
  await page.goto(currentUrl + path);

  expect(await page.getByText(path).innerText()).toBeTruthy();
  expect(await page.getByText("Error 404").innerText()).toBeTruthy();
  expect(await page.getByText("Something went wrong. Please try again later.").innerText()).toBeTruthy();
});
