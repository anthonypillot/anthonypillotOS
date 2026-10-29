import { test as base, expect } from "../../../support/fixtures";
import { cleanerEndpoint, cleanerInput, HistoryCleanerPage } from "../../../support/history-cleaner";
import type { HistoryCleanerResultFiltered } from "../../../../../shared/types/history-cleaner.type";

type Fixtures = { cleaner: HistoryCleanerPage };

const test = base.extend<Fixtures>({
  cleaner: async ({ page }, use) => {
    const cleaner = new HistoryCleanerPage(page);
    await cleaner.goto();
    await use(cleaner);
  },
});

test("form exposes labelled fields and safe defaults", async ({ cleaner }) => {
  await expect(cleaner.account).toBeEmpty();
  await expect(cleaner.repository).toBeEmpty();
  await expect(cleaner.token).toBeEmpty();
  await expect(cleaner.token).toHaveAttribute("type", "password");
  await expect(cleaner.workflows).toBeChecked();
  await expect(cleaner.workflows).toBeEnabled();
  await expect(cleaner.deployments).not.toBeChecked();
  await expect(cleaner.deployments).toBeDisabled();
  await expect(cleaner.submit).toHaveText("Submit");
  await expect(cleaner.submit).toBeEnabled();
});

test("invalid inputs block confirmation until corrected", async ({ cleaner, page }) => {
  await cleaner.submit.click();
  await expect(page.getByText("Account name is required", { exact: true })).toBeVisible();
  await expect(page.getByText("Repository name is required", { exact: true })).toBeVisible();
  await expect(page.getByText("GitHub PAT is required", { exact: true })).toBeVisible();
  await expect(cleaner.confirmation).toBeHidden();

  await cleaner.fill();
  await cleaner.token.fill("invalid-token");
  await cleaner.submit.click();
  await expect(page.getByText("GitHub PAT should start with ghp_", { exact: true })).toBeVisible();
  await expect(cleaner.confirmation).toBeHidden();

  await cleaner.openConfirmation();
  await expect(page.getByText("GitHub PAT should start with ghp_", { exact: true })).toBeHidden();
  await expect(cleaner.confirmation).toBeVisible();
});

test("clearing resets fields and deletion options", async ({ cleaner, page }) => {
  await cleaner.fill();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(cleaner.account).toBeEmpty();
  await expect(cleaner.repository).toBeEmpty();
  await expect(cleaner.token).toBeEmpty();
  await expect(cleaner.workflows).not.toBeChecked();
  await expect(cleaner.deployments).not.toBeChecked();

  await cleaner.fill();
  await cleaner.submit.click();
  await expect(page.getByText("At least one option is required", { exact: true })).toBeVisible();
  await expect(cleaner.confirmation).toBeHidden();
});

test("cancelling confirmation never submits a deletion request", async ({ cleaner }) => {
  await cleaner.openConfirmation();
  await expect(cleaner.confirmation).toContainText(cleanerInput.account);
  await expect(cleaner.confirmation).toContainText(cleanerInput.repository);
  await expect(cleaner.confirmation).toContainText("All workflow runs history will be deleted.");
  await cleaner.confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(cleaner.confirmation).toBeHidden();
  await expect(cleaner.account).toHaveValue(cleanerInput.account);
});

test("confirmation sends the selected options and renders all result counts", async ({ cleaner, page }) => {
  const result = {
    workflow: { success: 4, notFound: 3, unauthorized: 2, unknown: 1 },
    deployment: null,
  } satisfies HistoryCleanerResultFiltered;
  await page.route(cleanerEndpoint, async route => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ ...cleanerInput, options: ["workflow-runs"] });
    await route.fulfill({ json: result });
  });
  await cleaner.openConfirmation();
  await cleaner.confirmation.getByRole("button", { name: "Confirm", exact: true }).click();

  await expect(cleaner.confirmation).toBeHidden();
  await expect(page.getByText("Cleaner history result", { exact: true })).toBeVisible();
  await expect(page.getByText("Workflow deletion", { exact: true })).toBeVisible();
  await expect(page.getByText("Number of workflow runs deleted with success:")).toHaveText(/success: 4\./);
  await expect(page.getByText("Number workflow runs not found:")).toHaveText(/found: 3\./);
  await expect(page.getByText("Number of workflow unauthorized to delete:")).toHaveText(/delete: 2\./);
  await expect(page.getByText("Number of workflow runs not deleted for unknown reason:")).toHaveText(/reason: 1\./);
});

test("pending deletion prevents duplicate confirmation and cancellation", async ({ cleaner, page }) => {
  let releaseResponse: (() => void) | undefined;
  const responseReady = new Promise<void>(resolve => { releaseResponse = resolve; });
  let requests = 0;
  await page.route(cleanerEndpoint, async route => {
    requests++;
    await responseReady;
    await route.fulfill({ json: { workflow: null, deployment: null } satisfies HistoryCleanerResultFiltered });
  });

  try {
    await cleaner.openConfirmation();
    const confirm = cleaner.confirmation.getByRole("button", { name: "Confirm", exact: true });
    await confirm.click();
    await expect(confirm).toBeDisabled();
    await expect(cleaner.confirmation.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(cleaner.confirmation).toBeVisible();
    releaseResponse?.();
    await expect(cleaner.confirmation).toBeHidden();
    await expect(page.getByText("Everything went as expected, but nothing was found to delete.", { exact: true })).toBeVisible();
    expect(requests).toBe(1);
  } finally {
    releaseResponse?.();
  }
});

for (const scenario of [
  { status: 401, message: "The GitHub Personal Access Token (PAT) is not valid." },
  { status: 403, message: "The GitHub Personal Access Token (PAT) is not valid." },
  { status: 404, message: "The GitHub account or repository does not exist." },
  { status: 500, message: "An error occurred, please try again later." },
]) {
  test(`deletion error ${scenario.status} is explained and allows retry`, async ({ cleaner, page }) => {
    const retryResult = {
      workflow: { success: 1, notFound: 0, unauthorized: 0, unknown: 0 },
      deployment: null,
    } satisfies HistoryCleanerResultFiltered;
    let submissions = 0;
    await page.route(cleanerEndpoint, async route => {
      submissions++;
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ ...cleanerInput, options: ["workflow-runs"] });

      if (submissions === 1) {
        await route.fulfill({ status: scenario.status, json: { message: "E2E deletion failed" } });
        return;
      }
      await route.fulfill({ json: retryResult });
    });
    await cleaner.openConfirmation();
    const dialog = await cleaner.confirmAndAcceptAlert();
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toContain(scenario.message);
    await expect(cleaner.confirmation).toBeHidden();
    await expect(cleaner.submit).toBeEnabled();
    await expect(page.getByText("Cleaner history result", { exact: true })).toBeHidden();
    await expect(cleaner.account).toHaveValue(cleanerInput.account);
    await expect(cleaner.repository).toHaveValue(cleanerInput.repository);
    await expect(cleaner.token).toHaveValue(cleanerInput.token);
    expect(submissions, "Failed deletion must not automatically retry a destructive POST").toBe(1);

    await cleaner.submit.click();
    await expect(cleaner.confirmation).toBeVisible();
    expect(submissions, "Retry must wait for explicit confirmation").toBe(1);
    await cleaner.confirmation.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(cleaner.confirmation).toBeHidden();
    await expect(page.getByText("Cleaner history result", { exact: true })).toBeVisible();
    await expect(page.getByText("Number of workflow runs deleted with success:")).toHaveText(/success: 1\./);
    expect(submissions).toBe(2);
  });
}
