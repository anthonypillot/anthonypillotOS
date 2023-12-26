import { z } from "zod";

import { clean } from "~/server/services/history-cleaner.service";

import getLogger from "@/utils/logger";

const logger = getLogger();

export default defineEventHandler(async (event): Promise<HistoryCleanerResult> => {
  const body: Readonly<HistoryCleanerForm> = await Object.freeze(readBody(event));

  const validOptions = [
    "all-workflow-runs",
    // "only-workflow-runs-in-error",
    // "all-deployments"
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

  logger.info("Received history cleaner request:", body);

  /*
   * Block for some seconds to mock a long process.
   */
  // await new Promise((resolve) => setTimeout(resolve, 3_000));

  try {
    return await clean(body.account, body.repository, body.token, body.options);
  } catch (error: any) {
    logger.error(`History cleaner request failed, error: ${JSON.stringify(error.statusMessage)}`);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
      message: error.message || "An error occurred while processing the request",
    });
  }
});
