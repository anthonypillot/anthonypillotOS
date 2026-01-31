import { deleteWorkflowRun, getAllWorkflowRuns } from "@@/server/dao/github.dao";
import { create as createHistoryCleanerJob, update as updateHistoryCleanerJob } from "@@/server/dao/history-cleaner.dao";
import { GitHubDeletionStatusType, type GitHubWorkflowRun, type GitHubWorkflowRunDeletionResult } from "@@/server/types/github.type";
import { type HistoryCleanerJob, HistoryCleanerJobStatus, HistoryCleanerOptions } from "@@/server/types/history-cleaner.type";

import { logger } from "@@/server/utils/logger";

/**
 * Starts the history cleaner for the specified repository.
 * @param account - The account name.
 * @param repository - The repository name.
 * @param token - The authentication token.
 * @param options - The array of options for the history cleaner.
 * @returns A Promise that resolves to a HistoryCleanerJob object.
 */
export async function proceed(account: string, repository: string, token: string, options: string[]): Promise<HistoryCleanerJob> {
  logger.start(`Starting history cleaner for [${account}/${repository}] repository`);

  let status = HistoryCleanerJobStatus.PENDING;

  const jobId = await createHistoryCleanerJob(account, repository, status);
  const job: HistoryCleanerJob = {
    workflow: null,
    deployment: null,
  };

  if (options.includes(HistoryCleanerOptions.WORKFLOW_RUNS)) {
    status = await findAndDeleteWorkflowRuns(account, repository, token, status, job);
  }

  updateHistoryCleanerJob(jobId, status, job);

  return job;
}

/**
 * Finds and deletes workflow runs for a given account and repository.
 *
 * @param account - The account name.
 * @param repository - The repository name.
 * @param token - The authentication token.
 * @param status - The current status of the history cleaner job.
 * @param job - The history cleaner job object.
 * @returns The updated status of the history cleaner job.
 */
async function findAndDeleteWorkflowRuns(
  account: string,
  repository: string,
  token: string,
  status: HistoryCleanerJobStatus,
  job: HistoryCleanerJob
): Promise<HistoryCleanerJobStatus> {
  try {
    const workflowRuns = await getAllWorkflowRuns(account, repository, token);
    logger.info(`Retrieved [${workflowRuns.length}] workflow runs`);

    const workflowRunDeletionResult: GitHubWorkflowRunDeletionResult = await deleteWorkflowRuns(account, repository, token, workflowRuns);

    job.workflow = {
      success: workflowRunDeletionResult.success,
      notFound: workflowRunDeletionResult.notFound,
      unauthorized: workflowRunDeletionResult.unauthorized,
      unknown: workflowRunDeletionResult.unknown,
    };

    logger.success(
      `Deletion report for [${account}/${repository}] repository: [success: ${workflowRunDeletionResult.success.length}, not found: ${workflowRunDeletionResult.notFound.length}, unauthorized: ${workflowRunDeletionResult.unauthorized.length}, unknown: ${workflowRunDeletionResult.unknown.length}]`
    );
    status = HistoryCleanerJobStatus.COMPLETED;
  } catch (error: any) {
    logger.error(`Failed to delete workflow runs for [${account}/${repository}] repository: ${error.message}`);
    status = HistoryCleanerJobStatus.FAILED;
    throw error;
  }

  return status;
}

/**
 * Deletes workflow runs for a specific repository.
 *
 * @param account - The GitHub account name.
 * @param repository - The GitHub repository name.
 * @param token - The GitHub personal access token.
 * @param workflowRuns - An array of GitHubWorkflowRun objects representing the workflow runs to be deleted.
 * @returns A Promise that resolves to a GitHubWorkflowRunDeletionResult object or null.
 */
async function deleteWorkflowRuns(
  account: string,
  repository: string,
  token: string,
  workflowRuns: GitHubWorkflowRun[]
): Promise<GitHubWorkflowRunDeletionResult> {
  logger.info(`Proceeding to delete workflow runs for [${account}/${repository}] repository`);

  const deletionStatus: GitHubWorkflowRunDeletionResult = {
    success: [],
    notFound: [],
    unauthorized: [],
    unknown: [],
  };

  const deletions = workflowRuns.map(async (run) => {
    const result: GitHubDeletionStatusType = await deleteWorkflowRun(account, repository, token, run.id);

    switch (result) {
      case GitHubDeletionStatusType.SUCCESS:
        deletionStatus.success.push(run);
        break;
      case GitHubDeletionStatusType.NOT_FOUND:
        deletionStatus.notFound.push(run);
        break;
      case GitHubDeletionStatusType.UNAUTHORIZED:
        deletionStatus.unauthorized.push(run);
        break;
      case GitHubDeletionStatusType.UNKNOWN:
        deletionStatus.unknown.push(run);
        break;
      default:
        logger.error(`Unknown deletion status: ${result}`);
    }
  });

  await Promise.all(deletions);

  return deletionStatus;
}
