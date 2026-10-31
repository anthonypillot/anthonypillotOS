import { expect, test } from "../../../support/fixtures";
import { routes } from "../../../configuration";
import { expectReadableContrast } from "../../../support/contrast";

test("landing page launches the game without starting a round", async ({ page }) => {
  await page.goto(routes.itFactsLanding);
  await expect(page.getByRole("heading", { name: "IT Facts", level: 1 })).toBeVisible();
  await expect(page.getByTestId("it-facts-game-heading")).toHaveCount(0);
  const launch = page.getByTestId("it-facts-launch");
  await expect(launch).toHaveAttribute("href", routes.itFacts);
  await launch.click();
  await expect(page).toHaveURL(routes.itFacts);
  await expect(page.getByTestId("it-facts-game-heading")).toBeVisible();
  await expect(page.getByTestId("it-facts-progress")).toHaveText("A round of 10 questions awaits");
});

test("answers show feedback and cannot be changed before advancing", async ({ page }) => {
  await page.goto(routes.itFacts);
  await page.getByRole("button", { name: "Start a round", exact: true }).click();
  await expect(page.getByTestId("it-facts-statement")).toBeVisible();
  await expect(page.getByTestId("it-facts-statement")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByTestId("it-facts-progress")).toHaveText("Question 1 of 10");
  await expect(page.getByRole("button", { name: "True", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "False", exact: true }).click();
  await expect(page.getByTestId("it-facts-feedback")).toBeVisible();
  await expect(page.getByTestId("it-facts-explanation")).not.toBeEmpty();
  await expect(page.getByRole("button", { name: "True", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "False", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await expect(page.getByTestId("it-facts-progress")).toHaveText("Question 2 of 10");
  await expect(page.getByTestId("it-facts-feedback")).toBeHidden();
  await expect(page.getByRole("button", { name: "True", exact: true })).toBeEnabled();
});

test("a full round tracks scoring, persists the best score and supports replay", async ({ page }) => {
  // Stable shuffling without importing or coupling tests to the fact dataset.
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(routes.itFacts);
  await page.getByRole("button", { name: "Start a round", exact: true }).click();
  let score = 0;

  for (let index = 0; index < 10; index++) {
    await expect(page.getByTestId("it-facts-progress")).toHaveText(`Question ${index + 1} of 10`);
    await page.getByRole("button", { name: "True", exact: true }).click();
    const feedback = page.getByTestId("it-facts-feedback");
    await expect(feedback).toBeVisible();
    const isTrue = await feedback.getByText("It's true!", { exact: true }).isVisible();
    await expect(page.getByTestId("it-facts-feedback-badge")).toHaveText(isTrue ? "Correct" : "Incorrect");
    if (isTrue) score++;
    await expect(page.getByTestId("it-facts-running-score")).toHaveText(`Score: ${score} / 10`);
    await page.getByRole("button", { name: index === 9 ? "See result" : "Next question", exact: true }).click();
  }

  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThan(10);
  await expect(page.getByTestId("it-facts-result-heading")).toHaveText("Round complete");
  await expect(page.getByTestId("it-facts-result-score")).toHaveText(`You scored ${score} out of 10.`);
  await expect(page.getByTestId("it-facts-result-best")).toHaveText(`Best score: ${score}`);

  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.getByTestId("it-facts-progress")).toHaveText("Question 1 of 10");
  await expect(page.getByTestId("it-facts-running-score")).toHaveText("Score: 0 / 10");
  await expect(page.getByTestId("it-facts-result")).toBeHidden();
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem("it-facts:best"))).toBe(String(score));
  await expect(page.getByRole("button", { name: "Start a round", exact: true })).toBeVisible();
});

test("animated statements keep answer buttons stable and respect a motion preference change", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(routes.itFacts);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Start a round", exact: true }).click();
  const statement = page.getByTestId("it-facts-statement");
  await expect(statement).toHaveAttribute("aria-busy", "true");
  const positions = await page.getByRole("group", { name: "Answer", exact: true }).evaluate(async (element) => {
    const positions: number[] = [];
    while (document.querySelector('[data-testid="it-facts-statement"][aria-busy="true"]')) {
      positions.push(element.getBoundingClientRect().top);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    positions.push(element.getBoundingClientRect().top);
    return positions;
  });
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
  await page.getByRole("button", { name: "True", exact: true }).click();
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await statement.scrollIntoViewIfNeeded();
  await expect(statement).toHaveAttribute("aria-busy", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(statement).toHaveAttribute("aria-busy", "false");
  await expectReadableContrast(page);
});
