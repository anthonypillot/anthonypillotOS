import { version } from "@/package.json";
import { logger } from "@/server/utils/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineNitroPlugin(async (nitro) => {
  logger.start(`Starting [${useRuntimeConfig().app.website.title}] with version [${version}] and env. [${process.env.ENV || "local"}]`);
  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug mode is enabled");
  await checkDatabaseConnection();
});

/**
 * Checks the database connection and logs the result.
 * If the environment variable CI is set, the function skips the connection check.
 */
async function checkDatabaseConnection(): Promise<void> {
  if (!process.env.CI) {
    try {
      await prisma.$connect();
      logger.success(`Connected to the database: [${process.env.POSTGRES_DATABASE}]`);
      await prisma.$disconnect();
    } catch (error: any) {
      logger.error(`Failed to connect to the database: [${error.message}]`);
    }
  } else {
    logger.info("CI environment detected, skipping database connection check");
  }
}
