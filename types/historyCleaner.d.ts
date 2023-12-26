import { GitHubDeletionStatus } from "@/server/types/github";

declare global {
  interface HistoryCleanerForm {
    account: string;
    repository: string;
    token: string;
    options: string[];
  }

  interface HistoryCleanerResult {
    workflow: GitHubDeletionStatus | null;
    deployment: GitHubDeletionStatus | null;
  }
}

export {};
