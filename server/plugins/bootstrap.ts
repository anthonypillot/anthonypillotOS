import { version } from "@/package.json";
import { logger } from "@/server/utils/logger";

export default defineNitroPlugin((nitro) => {
  logger.start(
    `Starting [${useRuntimeConfig().app.website.title}] with version [${version}] and env. [${process.env.VERCEL_ENV || "local"}]`
  );

  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug mode is enabled");
});
