/**
 * Initializes all the necessary configurations and checks before starting the server.
 * @param nitro - The Nitro instance.
 */
export default defineNitroPlugin(async (_nitro) => {
  const config = useRuntimeConfig();

  convertConsoleLogToCustomLogger();
  logger.start(
    `Starting [${config.public.title}] with version [${process.env.APP_VERSION?.trim() || config.public.version}] (${process.env.GIT_SHA || "local"}) and env. [${
      process.env.ENV || "local"
    }]`
  );
  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug logging is enabled");
});
