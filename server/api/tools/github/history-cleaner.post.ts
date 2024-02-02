import { z } from "zod";

import { clean } from "@/server/services/history-cleaner.service";
import { HistoryCleanerResult } from "@/server/types/historyCleaner";

export default defineEventHandler(async (event): Promise<HistoryCleanerResultFiltered> => {
  const body: Readonly<HistoryCleanerForm> = await Object.freeze(readBody(event));

  const validOptions = [
    "all-workflow-runs",
    // "only-workflow-runs-in-error",
    // "all-deployments",
  ];

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
    const data: HistoryCleanerResult = await clean(body.account, body.repository, body.token, body.options);
    return extract(data);
  } catch (error: any) {
    logger.error(`History cleaner request failed, error: ${JSON.stringify(error.message)}`);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
      message: error.message || "An unknown error occurred while processing the request",
    });
  }
});

function extract(data: HistoryCleanerResult): HistoryCleanerResultFiltered {
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
