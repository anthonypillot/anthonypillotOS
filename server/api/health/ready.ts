interface ReadyResponse {
  statusCode: number;
  statusMessage: string;
  message: string;
}

export default defineEventHandler(async (): Promise<ReadyResponse> => {
  type Provider = {
    name: string;
    url: string;
  };

  const providers: Provider[] = [
    { name: "Google", url: "https://www.google.com" },
    { name: "GitHub", url: "https://api.github.com" },
    { name: "AWS", url: "https://aws.amazon.com" },
    { name: "Azure", url: "https://azure.microsoft.com" },
  ];

  const healthChecks = providers.map(async (provider) => {
    try {
      const response = await $fetch(provider.url);
      return {
        provider,
        status: response ? "up" : "down",
      };
    } catch (error) {
      return {
        provider,
        status: "down",
      };
    }
  });

  const healthCheckResponses = await Promise.all(healthChecks);

  const failedHealthCheckResponses = healthCheckResponses.filter((response) => response.status === "down");

  if (failedHealthCheckResponses.length > 0) {
    return {
      statusCode: 503,
      statusMessage: "Service Unavailable",
      message: `The following providers are not available: ${failedHealthCheckResponses
        .map((response) => response.provider.name)
        .join(", ")}`,
    };
  } else {
    return {
      statusCode: 200,
      statusMessage: "OK",
      message: "The server is ready",
    };
  }
});
