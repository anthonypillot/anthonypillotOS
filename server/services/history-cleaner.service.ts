import { deleteWorkflowRuns, getAllWorkflowRuns } from "@/server/dao/github.dao";
import { create as createHistoryCleanerRequest, update as updateHistoryCleanerRequest } from "@/server/dao/history-cleaner.dao";
import { GitHubWorkflowRunDeletionResult } from "@/server/types/github.d";
import { HistoryCleanerOptions, HistoryCleanerResult } from "@/server/types/historyCleaner.d";

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

    logger.info(`Deleting [${runs.length}] workflow runs`);
    const deletionResult: GitHubWorkflowRunDeletionResult = await deleteWorkflowRuns(account, repository, token, runs);

    logger.success(
      `Deletion report for [${account}/${repository}] repository: [success: ${deletionResult.success}, not found: ${deletionResult.notFound}, unauthorized: ${deletionResult.unauthorized}, unknown: ${deletionResult.unknown}]`
    );

    result.workflow = deletionResult;

    if (
      deletionResult.success.length > 0 ||
      deletionResult.notFound.length > 0 ||
      deletionResult.unauthorized.length > 0 ||
      deletionResult.unknown.length > 0
    ) {
      await updateHistoryCleanerRequest(requestId, formatGitHubWorkflowRunDeletionResult(deletionResult));
    } else {
      await updateHistoryCleanerRequest(requestId, null, "No workflow runs deleted");
    }
  }

  return result;
}

function formatGitHubWorkflowRunDeletionResult(result: GitHubWorkflowRunDeletionResult): string {
  const success = result.success.map((run) => ({ id: run.id, display_title: run.display_title }));
  const notFound = result.notFound.map((run) => ({ id: run.id, display_title: run.display_title }));
  const unauthorized = result.unauthorized.map((run) => ({ id: run.id, display_title: run.display_title }));
  const unknown = result.unknown.map((run) => ({ id: run.id, display_title: run.display_title }));

  return JSON.stringify({ success, notFound, unauthorized, unknown });
}
