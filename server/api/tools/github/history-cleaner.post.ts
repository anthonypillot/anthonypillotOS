import { z } from "zod";

import { clean } from "@/server/services/history-cleaner.service";
import { HistoryCleanerResult } from "@/server/types/historyCleaner";

import { logger } from "@/utils/logger";

export default defineEventHandler(
  async (
    event
  ): Promise<{
    workflow: {
      success: number;
      notFound: number;
      unauthorized: number;
      unknown: number;
    };
  }> => {
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

    logger.info(`Received history cleaner request for [${body.account}/${body.repository}]`);

    try {
      const result: HistoryCleanerResult = await clean(body.account, body.repository, body.token, body.options);
      return {
        workflow: {
          success: result.workflow?.success.length || 0,
          notFound: result.workflow?.notFound.length || 0,
          unauthorized: result.workflow?.unauthorized.length || 0,
          unknown: result.workflow?.unknown.length || 0,
        },
      };
    } catch (error: any) {
      logger.error(`History cleaner request failed, error: ${JSON.stringify(error.message)}`);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
        message: error.message || "An error occurred while processing the request",
      });
    }
  }
);
