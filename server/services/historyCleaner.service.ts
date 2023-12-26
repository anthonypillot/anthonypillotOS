import { deleteWorkflowRuns, getAllWorkflowRuns } from "@/server/dao/github.dao";
import { GitHubDeletionStatus } from "@/server/types/github.d";

import getLogger from "@/utils/logger";

const logger = getLogger();

export async function clean(account: string, repository: string, token: string, options: string[]): Promise<HistoryCleanerResult> {
  logger.start(`Starting history cleaner for [${account}/${repository}] repository`);

  const result: HistoryCleanerResult = {
    workflows: {
      complete: [],
      notFound: [],
      unauthorized: [],
      unknown: [],
    },
  };

  if (options.includes(HistoryCleanerOptions.ALL_WORKFLOW_RUNS)) {
    logger.info(`Option [${HistoryCleanerOptions.ALL_WORKFLOW_RUNS}] is enabled, retrieving all workflow runs`);
    const runs = await getAllWorkflowRuns(account, repository, token);
    logger.info(`Retrieved [${runs.workflowRuns.length}] workflow runs`);

    logger.info("Deleting workflow runs");
    const deletionStatus: GitHubDeletionStatus = await deleteWorkflowRuns(
      account,
      repository,
      token,
      runs.workflowRuns.map((run) => run.id).map((id) => id.toString())
    );
    logger.info(`Deletion result: ${JSON.stringify(deletionStatus)}`);

    result.workflows = deletionStatus;
  }

  return result;
}
