import { version } from "@/package.json";
import { convertConsoleLogToCustomLogger, logger } from "@/server/utils/logger";

/**
 * Initializes all the necessary configurations and checks before starting the server.
 * @param nitro - The Nitro instance.
 */
export default defineNitroPlugin(async (nitro) => {
  convertConsoleLogToCustomLogger();
  logger.start(
    `Starting [${useRuntimeConfig().app.website.title}] with version [${version}] (${process.env.GIT_SHA || "local"}) and env. [${
      process.env.ENV || "local"
    }]`
  );
  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug logging is enabled");
});
