import { z } from "zod";

import { proceed } from "@@/server/services/history-cleaner.service";
import { type HistoryCleanerJob, HistoryCleanerOptions } from "@@/server/types/history-cleaner.type";

export default defineEventHandler(async (event): Promise<HistoryCleanerResultFiltered> => {
  const body: Readonly<HistoryCleanerForm> = await Object.freeze(readBody(event));

  const validOptions: string[] = [HistoryCleanerOptions.WORKFLOW_RUNS, HistoryCleanerOptions.DEPLOYMENTS];

  const schema = z.object({
    account: z.string().min(1),
    repository: z.string().min(1),
    token: z.string().startsWith("ghp_"),
    options: z.array(
      z.string().refine(
        (option) => {
          return validOptions.includes(option);
        },
        { message: `Invalid option. Valid options are: ${validOptions.join(", ")}` }
      )
    ),
  });

  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: parsedBody.error.issues
        .map((issue) => {
          return `[${issue.path}] : ${issue.message}`;
        })
        .join(", "),
    });
  }

  logger.info(`Received history cleaner request for [${body.account}/${body.repository}]`);

  try {
    const job: HistoryCleanerJob = await proceed(body.account, body.repository, body.token, body.options);
    return extractAndFilterHistoryCleanerJob(job);
  } catch (error: unknown) {
    logger.error(`History cleaner request failed, error: ${error instanceof Error ? JSON.stringify(error.message) : String(error)}`);
    const h3Error = error as { statusCode?: number; statusMessage?: string; message?: string };
    throw createError({
      statusCode: h3Error.statusCode || 500,
      statusMessage: h3Error.statusMessage || "Internal Server Error",
      message: h3Error.message || "An unknown error occurred while processing the request",
    });
  }
});

function extractAndFilterHistoryCleanerJob(data: HistoryCleanerJob): HistoryCleanerResultFiltered {
  const result: HistoryCleanerResultFiltered = {
    workflow: null,
    deployment: null,
  };

  if (data.workflow) {
    result.workflow = {
      success: data.workflow.success.length,
      notFound: data.workflow.notFound.length,
      unauthorized: data.workflow.unauthorized.length,
      unknown: data.workflow.unknown.length,
    };
  }

  return result;
}
