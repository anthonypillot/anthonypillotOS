import { getApiConfiguration } from "@/server/config/api/github.config";
import {
  GitHubDeletionStatusType,
  GitHubWorkflowRun,
  GitHubWorkflowRunApiResponse,
  GitHubWorkflowRunDeletionResult,
} from "@/server/types/github.d";

import { logger } from "@/utils/logger";

const api = getApiConfiguration();

const maximumPerPage = 100;

/**
 * Retrieves all workflow runs for a given account and repository.
 *
 * @param account - The account name.
 * @param repository - The repository name.
 * @param token - The authentication token.
 * @returns A promise that resolves to an object containing the total count of workflow runs and an array of workflow runs.
 */
export async function getAllWorkflowRuns(account: string, repository: string, token: string): Promise<GitHubWorkflowRun[]> {
  const response: GitHubWorkflowRunApiResponse = await getWorkflowRuns(account, repository, token);

  let total = response.total_count - response.workflow_runs.length;
  let page = 2;

  while (total > 0) {
    logger.debug(`Retrieving page [${page}] of workflow runs for [${account}/${repository}] repository`);

    const newResponse: GitHubWorkflowRunApiResponse = await getWorkflowRuns(account, repository, token, page);

    total = total - newResponse.workflow_runs.length;
    response.workflow_runs.push(...newResponse.workflow_runs);

    logger.debug(`Added [${newResponse.workflow_runs.length}] workflow runs to the workflow runs array`);

    page++;
  }

  logger.debug(`Received [${response.workflow_runs.length}] workflow runs for [${account}/${repository}] repository`);

  return response.workflow_runs;
}

/**
 * Retrieves the workflow runs for a specific repository.
 * @param account - The GitHub account name.
 * @param repository - The repository name.
 * @param token - The GitHub personal access token.
 * @param page - The page number of the results (default is 1).
 * @returns A promise that resolves to the GitHubWorkflowRunApiResponse.
 *
 * @see https://docs.github.com/rest/actions/workflow-runs#list-workflow-runs-for-a-repository
 */
export async function getWorkflowRuns(
  account: string,
  repository: string,
  token: string,
  page: number = 1
): Promise<GitHubWorkflowRunApiResponse> {
  try {
    return await api(`/repos/${account}/${repository}/actions/runs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        per_page: maximumPerPage, // max allowed by GitHub API
        page: page,
      },
    });
  } catch (error: any) {
    const message = `Error while retrieving workflow runs for [${account}/${repository}] repository. Error: [${error.message}] from GitHub API`;
    logger.error(message);
    throw new Error(message);
  }
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
export async function deleteWorkflowRuns(
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

/**
 * Deletes a workflow run from a GitHub repository.
 * @param account - The GitHub account name.
 * @param repository - The name of the repository.
 * @param token - The access token for authentication.
 * @param id - The ID of the workflow run to delete.
 * @returns A promise that resolves to a string representing the deletion status.
 *
 * @see https://docs.github.com/rest/actions/workflow-runs#delete-a-workflow-run
 */
async function deleteWorkflowRun(account: string, repository: string, token: string, id: number): Promise<string> {
  let status: string = GitHubDeletionStatusType.UNKNOWN;

  try {
    await api(`/repos/${account}/${repository}/actions/runs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      async onResponse({ request, response, options }) {
        if (response.status === 204) {
          logger.debug(`Workflow run [${id}] from [${account}/${repository}] repository deleted successfully`);
          status = GitHubDeletionStatusType.SUCCESS;
        }
      },
      async onResponseError({ request, response, options }) {
        switch (response.status) {
          case 404:
            logger.debug(`Workflow run [${id}] from [${account}/${repository}] repository not found`);
            status = GitHubDeletionStatusType.NOT_FOUND;
            break;
          case 401:
          case 403:
            logger.debug(`Unauthorized to delete workflow run [${id}] from [${account}/${repository}] repository`);
            status = GitHubDeletionStatusType.UNAUTHORIZED;
            break;
          default:
            logger.debug(`Unknown error while deleting workflow run [${id}] from [${account}/${repository}] repository`);
            status = GitHubDeletionStatusType.UNKNOWN;
        }
      },
    });
  } catch (error: any) {
    logger.error(`Error while deleting workflow run [${id}] from [${account}/${repository}] repository: ${error.message} from GitHub API`);
  }

  return status;
}
