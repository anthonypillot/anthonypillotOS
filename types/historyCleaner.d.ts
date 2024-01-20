import { GitHubWorkflowRunDeletionResult } from "@/server/types/github";

declare global {
  interface HistoryCleanerForm {
    account: string;
    repository: string;
    token: string;
    options: string[];
  }

  interface HistoryCleanerResult {
    workflow: GitHubWorkflowRunDeletionResult | null;
    deployment: GitHubWorkflowRunDeletionResult | null;
  }
}

export {};
