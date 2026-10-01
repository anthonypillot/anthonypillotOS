export enum HistoryCleanerOptions {
  WORKFLOW_RUNS = "workflow-runs",
  DEPLOYMENTS = "deployments",
}

export type HistoryCleanerForm = {
  account: string;
  repository: string;
  token: string;
  options: string[];
};

export type HistoryCleanerResultFiltered = {
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
};
