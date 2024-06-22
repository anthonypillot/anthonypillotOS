import type { ConsolaInstance, LogLevel } from "consola";
import { createConsola } from "consola";

import { version } from "@/package.json";

/**
 * Returns a logger instance.
 *
 * Log level:
 *
 * 0: Fatal and Error
 * 1: Warnings
 * 2: Normal logs
 * 3: Informational logs, success, fail, ready, start, ...
 * 4: Debug logs
 * 5: Trace logs
 * -999: Silent
 * +999: Verbose logs
 *
 * @returns {ConsolaInstance} The logger instance.
 */
function getLogger(): ConsolaInstance {
  const logger = createConsola();

  if (process.env.NODE_ENV === "production") {
    logger.setReporters([
      {
        log: (logObj) => {
          logObj.message = logObj.args[0];
          logObj.level = mapLevel(logObj.level) as unknown as LogLevel;

          logObj.version = version;
          logObj.env = process.env.ENV || "local";

          console.log(JSON.stringify(logObj));
        },
      },
    ]);

    /**
     * Set log level to debug if the environment variable LOG_LEVEL is set to debug.
     */
    logger.level = process.env.LOG_LEVEL === "debug" ? 5 : 3;
  } else {
    logger.level = 5;
  }

  return logger;
}

function mapLevel(level: number): string {
  switch (level) {
    case 0:
      return "error";
    case 1:
      return "warn";
    case 2:
      return "info";
    case 3:
      return "info";
    case 4:
      return "debug";
    case 5:
      return "trace";
    default:
      return "info";
  }
}

/**
 * Converts console log methods to custom logger methods.
 */
export function convertConsoleLogToCustomLogger() {
  const consoleMethods = ["error", "warn", "info", "debug", "trace"];
  consoleMethods.forEach((method) => {
    // @ts-ignore
    console[method] = function () {
      if (arguments[0]) {
        const vueRouterWarn = "[Vue Router warn]: ";
        if (arguments[0].startsWith(vueRouterWarn)) {
          const argument: string = arguments[0].replace(vueRouterWarn, "");
          logger.warn(argument);
        } else {
          // @ts-ignore
          logger[method](arguments[0]);
        }
      }
    };
  });
}

export const logger: ConsolaInstance = getLogger();
