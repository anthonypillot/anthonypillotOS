import { getApplicationVersion } from "@@/runtime/application-version";

/**
 * Initializes all the necessary configurations and checks before starting the server.
 * @param nitro - The Nitro instance.
 */
export default defineNitroPlugin(async (_nitro) => {
  convertConsoleLogToCustomLogger();
  logger.start(
    `Starting [${useRuntimeConfig().public.title}] with version [${getApplicationVersion()}] (${process.env.GIT_SHA || "local"}) and env. [${
      process.env.ENV || "local"
    }]`
  );
  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug logging is enabled");
});
