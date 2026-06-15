import { test, expect } from "@playwright/test";
import { application } from "../../../configuration";

test("should display the hero and a Start a round control", async ({ page }) => {
  await page.goto(application.itFacts.url);

  await expect(page.getByRole("heading", { name: "IT Facts" }).first()).toBeVisible();
  await expect(page.getByTestId("start-round-button")).toBeVisible();
  await expect(page.getByTestId("it-facts-game-heading")).toBeVisible();
});

test("should start a round and show the first fact", async ({ page }) => {
  await page.goto(application.itFacts.url);

  await page.getByTestId("start-round-button").click();

  await expect(page.getByTestId("it-facts-statement")).toBeVisible();
  const statement = await page.getByTestId("it-facts-statement").textContent();
  expect(statement && statement.length > 0).toBeTruthy();

  await expect(page.getByTestId("answer-true")).toBeVisible();
  await expect(page.getByTestId("answer-false")).toBeVisible();
  await expect(page.getByTestId("it-facts-progress")).toContainText("Question 1 of 10");
});

test("should reach the result screen after 10 answers and allow a new round", async ({ page }) => {
  await page.goto(application.itFacts.url);

  await page.getByTestId("start-round-button").click();

  for (let i = 0; i < 10; i++) {
    await expect(page.getByTestId("answer-true")).toBeEnabled();
    await page.getByTestId("answer-true").click();

    await expect(page.getByTestId("it-facts-feedback")).toBeVisible();

    const next = page.getByTestId("it-facts-next");
    await expect(next).toBeVisible();
    await next.click();
  }

  await expect(page.getByTestId("it-facts-result")).toBeVisible();
  await expect(page.getByTestId("it-facts-result-heading")).toContainText("Round complete");
  await expect(page.getByTestId("it-facts-result-score")).toContainText("out of 10");

  await page.getByTestId("it-facts-play-again").click();

  await expect(page.getByTestId("it-facts-statement")).toBeVisible();
  await expect(page.getByTestId("it-facts-progress")).toContainText("Question 1 of 10");
});
