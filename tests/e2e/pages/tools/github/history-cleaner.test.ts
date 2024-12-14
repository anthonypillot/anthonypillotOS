import { application, currentUrl } from "@/tests/e2e/configuration";
import { expect, test } from "@playwright/test";

test("should have a right number of inputs and buttons", async ({ page }) => {
  await page.goto(application.githubHistoryCleaner.url);

  const inputs = await page.getByRole("textbox").all();
  const checkboxes = await page.getByRole("checkbox").all();
  const buttons = await page.getByRole("button").all();

  expect(inputs).toHaveLength(3);
  expect(checkboxes).toHaveLength(2);
  expect(buttons).toHaveLength(4);
});

test("should have the form filled with the default values", async ({ page }) => {
  await page.goto(application.githubHistoryCleaner.url);

  const [account, repository, token] = await page.getByRole("textbox").all();
  const [allWorkflowRuns, allDeployments] = await page.getByRole("checkbox").all();
  const [openMenu, tool, clearButton, submitButton] = await page.getByRole("button").all();

  expect(await account.inputValue()).toBe("");

  expect(await account.inputValue()).toBe("");
  expect(await repository.inputValue()).toBe("");
  expect(await token.inputValue()).toBe("");

  expect(await allWorkflowRuns.isChecked()).toBe(true);
  expect(await allWorkflowRuns.isDisabled()).toBe(false);
  expect(await allDeployments.isChecked()).toBe(false);
  expect(await allDeployments.isDisabled()).toBe(true);

  expect(await clearButton.textContent()).toBe("Clear");
  expect(await clearButton.isDisabled()).toBe(false);
  expect(await submitButton.textContent()).toBe(" Submit ");
  expect(await submitButton.isDisabled()).toBe(true);
});

test("should have the form cleared after clicking on the clear button", async ({ page }) => {
  await page.goto(application.githubHistoryCleaner.url);

  const [account, repository, token] = await page.getByRole("textbox").all();
  const [allWorkflowRuns, allDeployments] = await page.getByRole("checkbox").all();
  const [openMenu, tool, clearButton, submitButton] = await page.getByRole("button").all();

  await account.fill("my-account");
  await repository.fill("my-repository");
  await token.fill("ghp_abcd1234");

  await allWorkflowRuns.check();
  // await onlyWorkflowRunsInError.check(); // cannot be checked
  // await allDeployments.check(); // cannot be checked

  expect(await account.inputValue()).toBe("my-account");
  expect(await repository.inputValue()).toBe("my-repository");
  expect(await token.inputValue()).toBe("ghp_abcd1234");

  expect(await allWorkflowRuns.isChecked()).toBe(true);
  expect(await allDeployments.isChecked()).toBe(false);

  expect(await clearButton.isDisabled()).toBe(false);
  await clearButton.click();

  expect(await account.inputValue()).toBe("");
  expect(await repository.inputValue()).toBe("");
  expect(await token.inputValue()).toBe("");

  expect(await allWorkflowRuns.isChecked()).toBe(false);
  expect(await allDeployments.isChecked()).toBe(false);
});

if (!process.env.CI) {
  test("should have a result after confirmation", async ({ page }) => {
    await page.route(`${currentUrl}/api${application.githubHistoryCleaner.path}`, async (route) => {
      const json = {
        workflow: {
          success: 4,
          notFound: 3,
          unauthorized: 2,
          unknown: 1,
        },
        deployment: {
          success: 4,
          notFound: 3,
          unauthorized: 2,
          unknown: 1,
        },
      };
      await route.fulfill({ status: 200, json });
    });

    await page.goto(application.githubHistoryCleaner.url);

    const [account, repository, token] = await page.getByRole("textbox").all();
    const [allWorkflowRuns, allDeployments] = await page.getByRole("checkbox").all();
    const [openMenu, tool, clearButton, submitButton] = await page.getByRole("button").all();

    await account.fill("my-account");
    await repository.fill("my-repository");
    await token.fill("ghp_abcd1234");

    // await allWorkflowRuns.check(); // this is the default value
    // await onlyWorkflowRunsInError.check(); // cannot be checked
    // await allDeployments.check(); // cannot be checked

    expect(await account.inputValue()).toBe("my-account");
    expect(await repository.inputValue()).toBe("my-repository");
    expect(await token.inputValue()).toBe("ghp_abcd1234");

    expect(await allWorkflowRuns.isChecked()).toBe(true);
    expect(await allDeployments.isChecked()).toBe(false);

    expect(await submitButton.isDisabled()).toBe(false);

    await submitButton.click();

    expect(await page.getByRole("heading", { name: "Confirm deletion" }).innerText()).toBeTruthy();
    expect(await page.getByText("Are you sure you want to delete the history").innerText()).toContain(
      "Are you sure you want to delete the history of your GitHub account my-account and repository my-repository ?"
    );

    const confirmButton = page.getByRole("button", { name: "Confirm" });
    expect(await confirmButton.isDisabled()).toBe(false);
    await confirmButton.click();

    expect(await page.getByText("Cleaner history result").isVisible()).toBe(true);
    expect(await page.getByText("Workflow deletion").isVisible()).toBe(true);

    expect(await page.getByText("Number of workflow runs deleted with success:").innerText()).toContain("4");
    expect(await page.getByText("Number workflow runs not found:").innerText()).toContain("3");
    expect(await page.getByText("Number of workflow unauthorized to delete:").innerText()).toContain("2");
    expect(await page.getByText("Number of workflow runs not deleted for unknown reason:").innerText()).toContain("1");
  });
}
