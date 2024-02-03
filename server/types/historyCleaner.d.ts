import { GitHubWorkflowRunDeletionResult } from "@/server/types/github";

export enum HistoryCleanerOptions {
  ALL_WORKFLOW_RUNS = "all-workflow-runs",
  ONLY_WORKFLOW_RUNS_IN_ERROR = "only-workflow-runs-in-error",
  ALL_DEPLOYMENTS = "all-deployments",
}

export interface HistoryCleanerResult {
  workflow: GitHubWorkflowRunDeletionResult | null;
  deployment: GitHubWorkflowRunDeletionResult | null;
}
