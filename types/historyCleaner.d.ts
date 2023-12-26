import { GitHubDeletionStatus } from "@/server/types/github";

declare global {
  interface HistoryCleanerForm {
    account: string;
    repository: string;
    token: string;
    options: string[];
  }

  enum HistoryCleanerOptions {
    ALL_WORKFLOW_RUNS = "all-workflow-runs",
    ONLY_WORKFLOW_RUNS_IN_ERROR = "only-workflow-runs-in-error",
    ALL_DEPLOYMENTS = "all-deployments",
  }

  interface HistoryCleanerResult {
    workflows?: GitHubDeletionStatus;
    deployments?: GitHubDeletionStatus;
  }
}

export {};
