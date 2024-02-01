import { GitHubWorkflowRunDeletionResult } from "@/server/types/github";

declare global {
  interface HistoryCleanerForm {
    account: string;
    repository: string;
    token: string;
    options: string[];
  }

  interface HistoryCleanerResultFiltered {
    workflow: {
      success: number;
      notFound: number;
      unauthorized: number;
      unknown: number;
    } | null;
    deployment: {
      success: number;
      notFound: number;
      unauthorized: number;
      unknown: number;
    } | null;
  }
}

export {};
