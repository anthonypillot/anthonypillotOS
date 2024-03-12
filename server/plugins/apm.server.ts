import apm from "elastic-apm-node";

import { displayName } from "@/package.json";

export default defineNitroPlugin(async (nitro) => {
  nitro.hooks;
  apm.start({
    serviceName: displayName,
    serverUrl: process.env.ELASTIC_APM_SERVER_URL,
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
    environment: process.env.ENV || "local",
  });
});
