import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ReadyResponse {
  statusCode: number;
  statusMessage: string;
  message: string;
}

export default defineEventHandler(async (): Promise<ReadyResponse> => {
  const isDatabaseReady = await checkDatabase();
  const isExternalServiceReady = await checkExternalService();

  if (isDatabaseReady && isExternalServiceReady) {
    return {
      statusCode: 200,
      statusMessage: "OK",
      message: "The server is ready",
    };
  } else {
    return {
      statusCode: 503,
      statusMessage: "Service Unavailable",
      message:
        "The server is not ready" +
        (isDatabaseReady ? "" : " (Database is not ready)") +
        (isExternalServiceReady ? "" : " (External services are not ready)"),
    };
  }
});

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    logger.error(`Failed to connect to the database: [${error.message}]`);
    return false;
  }
}

let lastCheckedTime: number | null = null;
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

async function checkExternalService(): Promise<boolean> {
  const currentTime = Date.now();

  if (lastCheckedTime && currentTime - lastCheckedTime < CHECK_INTERVAL) {
    return true;
  }

  type ExternalService = {
    name: string;
    url: string;
  };

  const externalServices: ExternalService[] = [
    { name: "Google", url: "https://www.google.com" },
    { name: "AWS", url: "https://aws.amazon.com" },
    { name: "Azure", url: "https://azure.microsoft.com" },
  ];

  const externalServiceStatuses: Promise<{
    externalService: ExternalService;
    status: string;
  }>[] = externalServices.map(async (externalService) => {
    try {
      const response = await $fetch.raw(externalService.url);

      if (response.ok) {
        return { externalService, status: "up" };
      } else {
        return { externalService, status: "down" };
      }
    } catch (error: any) {
      logger.error(`Failed to connect to the external service [${externalService.name}]: [${error.message}]`);
      return { externalService, status: "down" };
    }
  });

  const externalServicesResponses: {
    externalService: ExternalService;
    status: string;
  }[] = await Promise.all(externalServiceStatuses);

  if (externalServicesResponses.some((response) => response.status === "down")) {
    const downServices: {
      externalService: ExternalService;
      status: string;
    }[] = externalServicesResponses.filter((response) => response.status === "down");
    logger.error(
      `The following external services are not available: ${downServices.map((response) => response.externalService.name).join(", ")}`
    );
    return false;
  } else {
    lastCheckedTime = currentTime;
    return true;
  }
}
