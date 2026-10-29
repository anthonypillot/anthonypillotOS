import type { Dialog, Page } from "@playwright/test";
import { routes } from "../configuration";

export const cleanerEndpoint = "/api/tools/github/history-cleaner";
export const cleanerInput = {
  account: "e2e-account",
  repository: "e2e-repository",
  token: "ghp_e2e_fake_token",
};

export class HistoryCleanerPage {
  constructor(readonly page: Page) {}

  get account() { return this.page.getByLabel("Account name or organization", { exact: true }); }
  get repository() { return this.page.getByLabel("Repository", { exact: true }); }
  get token() { return this.page.getByLabel("GitHub Personal Access Token (PAT)", { exact: true }); }
  get workflows() { return this.page.getByRole("checkbox", { name: "All workflow runs history", exact: true }); }
  get deployments() { return this.page.getByRole("checkbox", { name: /All deployment history/ }); }
  get submit() { return this.page.getByRole("button", { name: "Submit", exact: true }); }
  get confirmation() { return this.page.getByRole("dialog", { name: "Confirm deletion" }); }

  async goto(): Promise<void> {
    await this.page.goto(routes.githubHistoryCleaner);
  }

  async fill(): Promise<void> {
    await this.account.fill(cleanerInput.account);
    await this.repository.fill(cleanerInput.repository);
    await this.token.fill(cleanerInput.token);
  }

  async openConfirmation(): Promise<void> {
    await this.fill();
    await this.submit.click();
  }

  async confirmAndAcceptAlert(): Promise<Dialog> {
    const acceptAlert = async (): Promise<Dialog> => {
      const dialog = await this.page.waitForEvent("dialog");
      await dialog.accept();
      return dialog;
    };

    // An alert can block click completion, so accept it concurrently with the click.
    const [dialog] = await Promise.all([
      acceptAlert(),
      this.confirmation.getByRole("button", { name: "Confirm", exact: true }).click(),
    ]);
    return dialog;
  }
}
