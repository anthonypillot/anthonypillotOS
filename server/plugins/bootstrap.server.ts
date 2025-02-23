import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import * as opentelemetry from "@opentelemetry/sdk-node";

import { version } from "@/package.json";
import { convertConsoleLogToCustomLogger, logger } from "@/server/utils/logger";

/**
 * Initializes all the necessary configurations and checks before starting the server.
 * @param nitro - The Nitro instance.
 */
export default defineNitroPlugin(async (nitro) => {
  convertConsoleLogToCustomLogger();
  startOpenTelemetry();
  logger.start(
    `Starting [${useRuntimeConfig().app.website.title}] with version [${version}] (${process.env.GIT_SHA || "local"}) and env. [${
      process.env.ENV || "local"
    }]`
  );
  if (process.env.LOG_LEVEL === "debug") logger.debug("Debug logging is enabled");
});

//#region OpenTelemetry
function startOpenTelemetry(): void {
  /**
   * Enable debug logging for the SDK
   */
  process.env.OTEL_LOG_LEVEL = "DEBUG";

  if (process.env.NODE_ENV === "production") {
    logger.info("Starting OpenTelemetry");
    try {
      const sdk: opentelemetry.NodeSDK = new opentelemetry.NodeSDK({
        traceExporter: new OTLPTraceExporter({
          url: "http://alloy.alloy:4318/v1/traces",
        }),
        instrumentations: [getNodeAutoInstrumentations()],
      });
      sdk.start();
    } catch (error) {
      logger.error("Failed to start OpenTelemetry", error);
    }
  } else {
    logger.info("OpenTelemetry is disabled because the environment is not production");
  }
}
//#endregion
