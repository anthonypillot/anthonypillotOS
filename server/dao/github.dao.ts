import { getApiConfiguration } from "@/server/config/api/github.config";
import { GitHubDeletionStatus, GitHubDeletionStatusType, GitHubWorkflowRun, GitHubWorkflowRunApiResponse } from "@/server/types/github.d";

import getLogger from "@/utils/logger";

const logger = getLogger();

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
export async function getAllWorkflowRuns(
  account: string,
  repository: string,
  token: string
): Promise<{ total_count: number; workflowRuns: GitHubWorkflowRun[] }> {
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

  return {
    total_count: response.total_count,
    workflowRuns: response.workflow_runs,
  };
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
async function getWorkflowRuns(
  account: string,
  repository: string,
  token: string,
  page: number = 1
): Promise<GitHubWorkflowRunApiResponse> {
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
export async function deleteWorkflowRuns(account: string, repository: string, token: string, ids: string[]): Promise<GitHubDeletionStatus> {
  const status: GitHubDeletionStatus = {
    complete: [],
    notFound: [],
    unauthorized: [],
    unknown: [],
  };

  for (const id of ids) {
    const result = await deleteWorkflowRun(account, repository, token, id);

    switch (result) {
      case GitHubDeletionStatusType.COMPLETE:
        status.complete.push(id);
        break;
      case GitHubDeletionStatusType.NOT_FOUND:
        status.notFound.push(id);
        break;
      case GitHubDeletionStatusType.UNAUTHORIZED:
        status.unauthorized.push(id);
        break;
      case GitHubDeletionStatusType.UNKNOWN:
        status.unknown.push(id);
        break;
      default:
        logger.error(`Unknown deletion status: ${result}`);
    }
  }

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
async function deleteWorkflowRun(account: string, repository: string, token: string, id: string): Promise<string> {
  let status: string = GitHubDeletionStatusType.UNKNOWN;

  await api(`/repos/${account}/${repository}/actions/runs/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    async onResponseError({ request, response, options }) {
      if (response.status === 204) {
        status = GitHubDeletionStatusType.COMPLETE;
      } else if (response.status === 404) {
        status = GitHubDeletionStatusType.NOT_FOUND;
      } else if (response.status === 401 || response.status === 403) {
        status = GitHubDeletionStatusType.UNAUTHORIZED;
      } else {
        status = GitHubDeletionStatusType.UNKNOWN;
      }
    },
  });

  return status;
}
