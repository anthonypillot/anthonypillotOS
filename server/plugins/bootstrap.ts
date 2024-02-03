import { version } from "@/package.json";
import { logger } from "@/server/utils/logger";
import { PrismaClient } from "@prisma/client";
import { exit } from "process";

const prisma = new PrismaClient();

export default defineNitroPlugin(async (nitro) => {
  logger.start(
    `Starting [${useRuntimeConfig().app.website.title}] with version [${version}] and env. [${process.env.VERCEL_ENV || "local"}]`
  );

  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug mode is enabled");

  try {
    await prisma.$connect();
    logger.success(`Connected to the database: [${process.env.POSTGRES_DATABASE}]`);
    await prisma.$disconnect();
  } catch (error: any) {
    logger.error(`Failed to connect to the database: [${error.message}]`);
    exit(1);
  }
});
