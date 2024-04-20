import { test, expect } from "@playwright/test";

const path = "/";

test("should have a hero section with job presentation", async ({ page }) => {
  await page.goto(path);

  expect(await page.getByText("Freelance Software Engineer, Real Full Stack Developer, and more.").innerText()).toBeTruthy();
  expect(await page.getByText("Lille, France. Remote and on-site work.").innerText()).toBeTruthy();
});
