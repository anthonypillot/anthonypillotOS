import { test, expect, type Page } from "@playwright/test";
import { application } from "@/tests/e2e/configuration";

test("should display the TaskHold’em application", async ({ page }) => {
  await page.goto(application.taskHoldem.url);

  await expect(page.getByRole("heading", { name: "TaskHold’em" })).toBeVisible();
  await expect(page.getByText("To join the game, please enter your informations")).toBeVisible();

  await joinGame(page, "Anthony", "boy");
});

test("should allow multiple players to join and interact in the game", async ({ browser, page }) => {
  await page.goto(application.taskHoldem.url);
  await joinGame(page, "Anthony", "boy");

  const url = new URL(page.url());
  const gameId = url.searchParams.get("id");

  const context = await browser.newContext();
  const secondPage = await context.newPage();
  await secondPage.goto(application.taskHoldem.url + `?id=${gameId}`);
  await joinGame(secondPage, "Emmanuelle", "girl");

  const revealButton = page.getByTestId("reveal-button");
  await expect(revealButton).toBeVisible();
  await expect(revealButton).toBeDisabled();

  const cardOnFirstPageValue = 8;
  const cardOnFirstPage = page.getByText(cardOnFirstPageValue.toString(), { exact: true });
  await cardOnFirstPage.click();

  const cardOnSecondPageValue = 21;
  const cardOnSecondPage = secondPage.getByText(cardOnSecondPageValue.toString(), { exact: true });
  await cardOnSecondPage.click();

  await expect(revealButton).toBeEnabled();
  await revealButton.click();

  await expect(page.getByText("Result")).toBeVisible();
  await expect(page.getByText(`Average: ${(cardOnFirstPageValue + cardOnSecondPageValue) / 2}`)).toBeVisible();

  const restartButton = page.getByTestId("restart-button");
  await expect(restartButton).toBeVisible();
  await restartButton.click();

  await expect(revealButton).toBeVisible();

  await secondPage.close();
  await context.close();

  await expect(page.getByText("Emmanuelle")).not.toBeVisible();
});

async function joinGame(page: Page, name: string, gender: "boy" | "girl"): Promise<void> {
  const input = page.getByPlaceholder("Your name");
  await expect(input).toBeVisible();
  await input.fill(name);

  if (gender === "boy") {
    const boyRadioButton = page.getByLabel("Boy");
    await expect(boyRadioButton).toBeVisible();
    await boyRadioButton.click();
  } else if (gender === "girl") {
    const girlRadioButton = page.getByLabel("Girl");
    await expect(girlRadioButton).toBeVisible();
    await girlRadioButton.click();
  }

  const button = page.getByRole("button", { name: "Join game" });
  await expect(button).toBeVisible();
  await button.click();

  await expect(page.getByText(`Name: ${name}`)).toBeVisible();
  await expect(page.locator("p").filter({ hasText: new RegExp(`^${name}$`) })).toBeVisible();

  if (gender === "boy") {
    await expect(page.getByRole("img", { name: "poker player boy" })).toBeVisible();
  } else if (gender === "girl") {
    await expect(page.getByRole("img", { name: "poker player girl" })).toBeVisible();
  }
}
