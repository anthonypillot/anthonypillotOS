import type { GitHubWorkflowRunDeletionResult } from "#server/types/github.type";

export enum HistoryCleanerOptions {
  WORKFLOW_RUNS = "workflow-runs",
  DEPLOYMENTS = "deployments",
}

export interface HistoryCleanerJob {
  workflow: GitHubWorkflowRunDeletionResult | null;
  deployment: GitHubWorkflowRunDeletionResult | null;
}

export enum HistoryCleanerJobStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
