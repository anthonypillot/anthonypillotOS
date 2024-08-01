import { type HistoryCleanerJobResult, PrismaClient } from "@prisma/client";
import { type HistoryCleanerJob, HistoryCleanerJobStatus } from "@/server/types/history-cleaner.type";

import { logger } from "@/server/utils/logger";

const prisma = new PrismaClient();

/**
 * Retrieves all history cleaner requests.
 * @returns A promise that resolves to an array of HistoryCleanerJob objects.
 */
export async function findAll(): Promise<HistoryCleanerJobResult[]> {
  logger.debug("Find all history cleaner requests in database");
  return await prisma.historyCleanerJobResult.findMany();
}

/**
 * Finds a history cleaner request by its ID.
 * @param id - The ID of the history cleaner request.
 * @returns A Promise that resolves to the found history cleaner request, or null if not found.
 */
export async function find(id: string): Promise<HistoryCleanerJobResult | null> {
  logger.debug("Find all history cleaner requests by ID in database");
  return await prisma.historyCleanerJobResult.findUnique({
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
export async function create(account: string, repository: string, status: HistoryCleanerJobStatus): Promise<string> {
  logger.debug(`Create history cleaner request for [${account}/${repository}] repository in database`);
  return (
    await prisma.historyCleanerJobResult.create({
      data: {
        account,
        repository,
        status,
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
export async function update(id: string, status: HistoryCleanerJobStatus, job: HistoryCleanerJob | null): Promise<HistoryCleanerJobResult> {
  logger.debug(`Update history cleaner request with ID [${id}] in database`);

  return await prisma.historyCleanerJobResult.update({
    where: {
      id,
    },
    data: {
      status,
      workflowRunDeletionResult: {
        upsert: {
          where: {
            historyCleanerJobResultId: id,
          },
          create: {
            countSuccess: job?.workflow?.success.length,
            countNotFound: job?.workflow?.notFound.length,
            countUnauthorized: job?.workflow?.unauthorized.length,
            countUnknown: job?.workflow?.unknown.length,
          },
          update: {
            countSuccess: job?.workflow?.success.length,
            countNotFound: job?.workflow?.notFound.length,
            countUnauthorized: job?.workflow?.unauthorized.length,
            countUnknown: job?.workflow?.unknown.length,
          },
        },
      },
      deploymentDeletionResult: {
        upsert: {
          where: {
            historyCleanerJobResultId: id,
          },
          create: {
            countSuccess: job?.deployment?.success.length,
            countNotFound: job?.deployment?.notFound.length,
            countUnauthorized: job?.deployment?.unauthorized.length,
            countUnknown: job?.deployment?.unknown.length,
          },
          update: {
            countSuccess: job?.deployment?.success.length,
            countNotFound: job?.deployment?.notFound.length,
            countUnauthorized: job?.deployment?.unauthorized.length,
            countUnknown: job?.deployment?.unknown.length,
          },
        },
      },
    },
  });
}

export async function deleteAll(): Promise<void> {
  logger.debug(`Delete all history cleaner requests in database`);
  await prisma.historyCleanerJobResult.deleteMany({});
}
