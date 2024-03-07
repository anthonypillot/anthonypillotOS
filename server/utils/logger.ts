import type { ConsolaInstance } from "consola";
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

export const logger: ConsolaInstance = getLogger();
