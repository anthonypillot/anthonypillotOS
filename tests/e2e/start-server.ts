import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";

mkdirSync("logs", { recursive: true });
const log = openSync("logs/e2e-server.log", "w");
const server = spawn(process.execPath, [".output/server/index.mjs"], {
  stdio: ["ignore", log, log],
});
closeSync(log);

server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));
