import { HistoryCleanerRequest, PrismaClient } from "@prisma/client";

import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

/**
 * Retrieves all history cleaner requests.
 * @returns A promise that resolves to an array of HistoryCleanerRequest objects.
 */
export async function findAll(): Promise<HistoryCleanerRequest[]> {
  logger.info("Find all history cleaner requests");
  return await prisma.historyCleanerRequest.findMany();
}

/**
 * Finds a history cleaner request by its ID.
 * @param id - The ID of the history cleaner request.
 * @returns A Promise that resolves to the found history cleaner request, or null if not found.
 */
export async function find(id: number): Promise<HistoryCleanerRequest | null> {
  logger.info("Find all history cleaner requests");
  return await prisma.historyCleanerRequest.findUnique({
    where: {
      id: id,
    },
  });
}

/**
 * Creates a history cleaner request for the specified account and repository.
 * @param account - The account associated with the repository.
 * @param repository - The name of the repository.
 * @returns A Promise that resolves to the ID of the created history cleaner request.
 */
export async function create(account: string, repository: string): Promise<number> {
  logger.info(`Create history cleaner request for [${account}/${repository}] repository`);
  return (
    await prisma.historyCleanerRequest.create({
      data: {
        account: account,
        repository: repository,
      },
    })
  ).id;
}

/**
 * Updates a history cleaner request with the specified ID.
 * @param id - The ID of the history cleaner request to update.
 * @param result - The workflow run deletion result to set.
 * @returns A Promise that resolves to the updated HistoryCleanerRequest object.
 */
export async function update(id: number, workflowRunDeletionResult: string | null, error?: string): Promise<HistoryCleanerRequest> {
  logger.info(`Update history cleaner request with ID [${id}]`);
  return await prisma.historyCleanerRequest.update({
    where: {
      id: id,
    },
    data: {
      workflowRunDeletionResult: workflowRunDeletionResult ? workflowRunDeletionResult : null,
      error: error ? error : null,
    },
  });
}
