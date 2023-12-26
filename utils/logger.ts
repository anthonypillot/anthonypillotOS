import { useLogger } from "@nuxt/kit";
import type { ConsolaInstance } from "consola";

import { version } from "@/package.json";

let logger: ConsolaInstance | null = null;

export default function getLogger(): ConsolaInstance {
  if (logger) {
    return logger;
  } else {
    let newLogger = useLogger(useRuntimeConfig().app.website.title);

    if (process.env.NODE_ENV === "production") {
      newLogger.setReporters([
        {
          log: (logObj) => {
            logObj.version = version;

            console.log(JSON.stringify(logObj));
          },
        },
      ]);
      newLogger.level = 5; // is the debug level
    } else {
      newLogger.level = 5; // is the debug level
    }

    logger = newLogger;
    return logger;
  }
}
