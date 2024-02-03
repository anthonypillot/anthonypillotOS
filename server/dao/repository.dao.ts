import { HistoryCleanerRequest, PrismaClient } from "@prisma/client";

import { logger } from "@/server/utils/logger";

const prisma = new PrismaClient();

/**
 * Retrieves all history cleaner requests.
 * @returns A promise that resolves to an array of HistoryCleanerRequest objects.
 */
export async function findAll(): Promise<HistoryCleanerRequest[]> {
  logger.debug("Find all history cleaner requests in database");
  return await prisma.historyCleanerRequest.findMany();
}

/**
 * Finds a history cleaner request by its ID.
 * @param id - The ID of the history cleaner request.
 * @returns A Promise that resolves to the found history cleaner request, or null if not found.
 */
export async function find(id: number): Promise<HistoryCleanerRequest | null> {
  logger.debug("Find all history cleaner requests by ID in database");
  return await prisma.historyCleanerRequest.findUnique({
    where: {
      id,
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
  logger.debug(`Create history cleaner request for [${account}/${repository}] repository in database`);
  return (
    await prisma.historyCleanerRequest.create({
      data: {
        account,
        repository,
        status: "Pending",
      },
    })
  ).id;
}

/**
 * Updates a history cleaner request with the specified ID.
 * @param id - The ID of the history cleaner request to update.
 * @param request - The updated history cleaner request data.
 * @returns A Promise that resolves to the updated history cleaner request.
 */
export async function update(id: number, status: string, workflowRunDeletionResult: string | null): Promise<HistoryCleanerRequest> {
  logger.debug(`Update history cleaner request with ID [${id}] in database`);
  return await prisma.historyCleanerRequest.update({
    where: {
      id,
    },
    data: {
      status,
      workflowRunDeletionResult,
    },
  });
}
