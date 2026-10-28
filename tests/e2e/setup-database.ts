import { spawnSync } from "node:child_process";
import { databaseURL } from "./configuration.ts";

const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push"], {
  env: { ...process.env, POSTGRES_PRISMA_URL: databaseURL },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
