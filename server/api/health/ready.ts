import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ReadyResponse {
  statusCode: number;
  statusMessage: string;
  message: string;
}

export default defineEventHandler(async (): Promise<ReadyResponse> => {
  const isDatabaseReady = await checkDatabase();

  if (isDatabaseReady) {
    return {
      statusCode: 200,
      statusMessage: "OK",
      message: "The server is ready",
    };
  } else {
    return {
      statusCode: 503,
      statusMessage: "Service Unavailable",
      message: "The server is not ready (database is not ready)",
    };
  }
});

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error: any) {
    logger.error(`Failed to connect to the database: [${error.message}]`);
    return false;
  }
}
