import { useLogger } from "@nuxt/kit";
import type { ConsolaInstance } from "consola";

import { version } from "@/package.json";

/**
 * Returns a logger instance.
 * @returns {ConsolaInstance} The logger instance.
 *
 * Log levels:
 *
 * 0: Fatal and Error
 * 1: Warnings
 * 2: Normal logs
 * 3: Informational logs, success, fail, ready, start, ...
 * 4: Debug logs
 * 5: Trace logs
 * -999: Silent
 * +999: Verbose logs
 */
function getLogger(): ConsolaInstance {
  const logger = useLogger(useRuntimeConfig().app.website.title);

  if (process.env.NODE_ENV === "production") {
    logger.setReporters([
      {
        log: (logObj) => {
          logObj.version = version;
          logObj.message = logObj.args[0];

          //@ts-ignore
          delete logObj.args;
          console.log(JSON.stringify(logObj));
        },
      },
    ]);
    logger.level = 5; // is the debug level
  } else {
    logger.level = 5; // is the debug level
  }

  return logger;
}

export const logger: ConsolaInstance = getLogger();
