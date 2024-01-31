import { getAllWorkflowRuns, deleteWorkflowRun } from "@/server/dao/github.dao";
import { GitHubDeletionStatusType, GitHubWorkflowRun, GitHubWorkflowRunDeletionResult } from "@/server/types/github.d";
import { HistoryCleanerOptions, HistoryCleanerResult } from "@/server/types/historyCleaner.d";
import { create as createHistoryCleanerRequest, update as updateHistoryCleanerRequest } from "~/server/dao/postgres.dao";

import { logger } from "@/server/utils/logger";

export async function clean(account: string, repository: string, token: string, options: string[]): Promise<HistoryCleanerResult> {
  logger.start(`Starting history cleaner for [${account}/${repository}] repository`);

  const requestId = await createHistoryCleanerRequest(account, repository);

  const runs = await getAllWorkflowRuns(account, repository, token);
  logger.info(`Retrieved [${runs.length}] workflow runs`);

  const result: HistoryCleanerResult = {
    workflow: null,
    deployment: null,
  };

  if (options.includes(HistoryCleanerOptions.ALL_WORKFLOW_RUNS)) {
    logger.info(`Option [${HistoryCleanerOptions.ALL_WORKFLOW_RUNS}] is enabled, retrieving all workflow runs`);

    logger.info(`Deleting [${runs.length}] workflow runs for [${account}/${repository}] repository ...`);
    const deletionResult: GitHubWorkflowRunDeletionResult = await deleteWorkflowRuns(account, repository, token, runs);

    logger.success(
      `Deletion report for [${account}/${repository}] repository: [success: ${deletionResult.success.length}, not found: ${deletionResult.notFound.length}, unauthorized: ${deletionResult.unauthorized.length}, unknown: ${deletionResult.unknown.length}]`
    );

    result.workflow = deletionResult;

    let status = "Aborted, no workflow runs found";
    if (
      deletionResult.success.length > 0 ||
      deletionResult.notFound.length > 0 ||
      deletionResult.unauthorized.length > 0 ||
      deletionResult.unknown.length > 0
    ) {
      status = "Completed";
    }

    updateHistoryCleanerRequest(requestId, {
      account: account,
      repository: repository,
      status: status,
      workflowRunDeletionResult: status === "Completed" ? formatGitHubWorkflowRunDeletionResult(deletionResult) : undefined,
    });
  }

  return result;
}

/**
 * Deletes multiple workflow runs for a given account and repository.
 * @param account - The account name.
 * @param repository - The repository name.
 * @param token - The authentication token.
 * @param ids - An array of workflow run IDs to delete.
 * @returns A promise that resolves to a DeletionStatus object containing the status of the deletions.
 *
 * @see https://docs.github.com/rest/actions/workflow-runs#delete-a-workflow-run
 */
async function deleteWorkflowRuns(
  account: string,
  repository: string,
  token: string,
  runs: GitHubWorkflowRun[]
): Promise<GitHubWorkflowRunDeletionResult> {
  const status: GitHubWorkflowRunDeletionResult = {
    success: [],
    notFound: [],
    unauthorized: [],
    unknown: [],
  };

  const deletions = runs.map(async (run) => {
    const result = await deleteWorkflowRun(account, repository, token, run.id);

    switch (result) {
      case GitHubDeletionStatusType.SUCCESS:
        status.success.push(run);
        break;
      case GitHubDeletionStatusType.NOT_FOUND:
        status.notFound.push(run);
        break;
      case GitHubDeletionStatusType.UNAUTHORIZED:
        status.unauthorized.push(run);
        break;
      case GitHubDeletionStatusType.UNKNOWN:
        status.unknown.push(run);
        break;
      default:
        logger.error(`Unknown deletion status: ${result}`);
    }
  });

  await Promise.all(deletions);

  return status;
}

function formatGitHubWorkflowRunDeletionResult(result: GitHubWorkflowRunDeletionResult): string {
  const { success, notFound, unauthorized, unknown } = result;

  const formatRun = (run: GitHubWorkflowRun) => ({
    id: run.id,
    display_title: run.display_title,
    head_branch: run.head_branch,
    event: run.event,
    created_at: run.created_at,
    updated_at: run.updated_at,
    actor: run.actor.login,
    triggering_actor: run.triggering_actor.login,
  });

  const formattedResult = {
    success: success.map(formatRun),
    notFound: notFound.map(formatRun),
    unauthorized: unauthorized.map(formatRun),
    unknown: unknown.map(formatRun),
  };

  return JSON.stringify(formattedResult);
}
