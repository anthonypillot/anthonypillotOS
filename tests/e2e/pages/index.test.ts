import { currentUrl } from "@/tests/e2e/configuration";
import { expect, test } from "@playwright/test";

test("should have a hero section with job presentation", async ({ page }) => {
  await page.goto(currentUrl);

  expect(await page.getByText("Freelance Software Engineer, Real Full Stack Developer, and more.").innerText()).toBeTruthy();
  expect(await page.getByText("Lille, France. Remote and on-site work.").innerText()).toBeTruthy();
});
