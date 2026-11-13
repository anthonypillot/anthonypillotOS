import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, openSync, writeSync } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { baseURL, databaseURL, rootDirectory, secondaryBaseURL } from "./configuration.ts";

type Command = {
  file: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
  logName?: string;
  persistent?: boolean;
  cleanup?: boolean;
  timeout?: number;
};

type RunningProcess = {
  child: ChildProcess;
  closed: Promise<number | null>;
  output: string;
  error?: Error;
};

const servers = [
  { name: "server", url: baseURL },
  { name: "secondary-server", url: secondaryBaseURL },
];

async function assertPortAvailable(url: string): Promise<void> {
  const { hostname, port } = new URL(url);
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", () => reject(new Error(
      `Port ${port} is occupied; stop the existing service or use E2E_DATABASE_MODE=external for a manually started E2E database`,
    )));
    server.listen(Number(port), hostname, resolve);
  });
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
}

async function waitForReadiness(url: string, signal: AbortSignal): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    try {
      const response = await fetch(`${url}/api/health/ready`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]),
      });
      if (response.ok) {
        const body: { statusCode?: number } | null = await response.json();
        if (body?.statusCode === 200) return;
      } else {
        await response.body?.cancel();
      }
    } catch {
      // Connection failures and request timeouts are expected while Nitro starts.
      signal.throwIfAborted();
    }
    await delay(250, undefined, { signal });
  }
  throw new Error(`E2E server did not become database-ready: ${url}`);
}

export function createEnvironment() {
  const controller = new AbortController();
  const finished = Promise.withResolvers<undefined>();
  const processes = new Set<RunningProcess>();
  const composeProject = `os-e2e-${process.pid}-${randomUUID()}`;
  const composeArguments = ["compose", "--project-name", composeProject, "--file", "tests/e2e/compose.yaml"];
  const environment = { ...process.env, POSTGRES_PRISMA_URL: databaseURL };
  let log: number | undefined;
  let composeStarted = false;
  let startup: Promise<void> | undefined;
  let shutdown: Promise<void> | undefined;
  let exitCode = 0;

  function signalProcess(child: ChildProcess, signal: NodeJS.Signals): void {
    if (!child.pid) return;
    try {
      if (process.platform === "win32") child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ESRCH") {
        console.error(error);
        exitCode = 1;
      }
    }
  }

  function startProcess(command: Command): RunningProcess {
    if (!command.cleanup) controller.signal.throwIfAborted();
    if (log === undefined) throw new Error("E2E logging has not been initialized");
    const output = command.logName ? openSync(join(rootDirectory, "logs", `e2e-${command.logName}.log`), "w") : log;
    let child: ChildProcess;
    try {
      child = spawn(command.file, command.args, {
        cwd: rootDirectory,
        env: command.env ?? environment,
        detached: process.platform !== "win32",
        stdio: ["ignore", command.persistent ? output : "pipe", output],
      });
    } finally {
      if (command.logName) closeSync(output);
    }
    const closed = Promise.withResolvers<number | null>();
    const running: RunningProcess = { child, closed: closed.promise, output: "" };
    processes.add(running);
    child.stdout?.on("data", (data: Buffer) => {
      writeSync(output, data);
      running.output += data.toString();
    });
    child.once("error", (error) => {
      running.error = error;
    });
    child.once("close", (code) => {
      processes.delete(running);
      closed.resolve(code);
      if (command.persistent && !controller.signal.aborted) {
        console.error(`E2E ${command.logName} exited unexpectedly (code ${code}); see logs/e2e-${command.logName}.log`, running.error ?? "");
        exitCode = 1;
        void stop();
      }
    });
    return running;
  }

  async function runCommand(command: Command): Promise<string> {
    console.log(`[E2E] ${command.file} ${command.args.join(" ")}`);
    const running = startProcess(command);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      signalProcess(running.child, "SIGKILL");
    }, command.timeout ?? 30_000);
    timeout.unref();
    try {
      const code = await running.closed;
      if (!command.cleanup) controller.signal.throwIfAborted();
      if (running.error) throw running.error;
      if (timedOut || code !== 0) {
        throw new Error(`E2E command ${timedOut ? "timed out" : "failed"}: ${command.file} ${command.args.join(" ")}; see logs/e2e-environment.log`);
      }
      return running.output;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function start(): Promise<void> {
    controller.signal.throwIfAborted();
    await mkdir(join(rootDirectory, "logs"), { recursive: true });
    log = openSync(join(rootDirectory, "logs", "e2e-environment.log"), "w");
    const mode = process.env.E2E_DATABASE_MODE ?? "managed";
    if (mode !== "managed" && mode !== "external") {
      throw new Error("E2E_DATABASE_MODE must be managed or external");
    }
    try {
      await access(join(rootDirectory, ".output/server/index.mjs"));
    } catch {
      throw new Error("The production build is missing; run npm run build before Playwright");
    }
    await Promise.all([
      ...servers.map(server => assertPortAvailable(server.url)),
      ...(mode === "managed" ? [assertPortAvailable(databaseURL)] : []),
    ]);
    if (mode === "managed") {
      await runCommand({ file: "docker", args: ["info", "--format", "{{.ServerVersion}}"], timeout: 10_000 });
      const existingContainer = await runCommand({
        file: "docker",
        args: ["ps", "--all", "--filter", "name=^/os-e2e-postgres$", "--format", "{{.Names}}"],
        timeout: 10_000,
      });
      if (existingContainer.trim()) {
        throw new Error("The os-e2e-postgres container already exists; remove it yourself or select E2E_DATABASE_MODE=external");
      }
      composeStarted = true;
      await runCommand({
        file: "docker",
        args: [...composeArguments, "up", "--detach", "--wait", "--wait-timeout", "90"],
        timeout: 120_000,
      });
    }
    await runCommand({ file: process.execPath, args: ["tests/e2e/support/setup-database.ts"] });
    for (const server of servers) {
      const { hostname, port } = new URL(server.url);
      startProcess({
        file: process.execPath,
        args: [".output/server/index.mjs"],
        persistent: true,
        logName: server.name,
        env: {
          ...environment,
          HOST: hostname,
          PORT: port,
          NITRO_HOST: hostname,
          NITRO_PORT: port,
          E2E_SERVER_NAME: server.name,
          TASK_HOLDEM_GRACE_MS: "4000",
          TASK_HOLDEM_REVEAL_MS: "750",
          ENV: "e2e",
          LOG_LEVEL: "info",
        },
      });
    }
    await Promise.all(servers.map(server => waitForReadiness(server.url, controller.signal)));
    controller.signal.throwIfAborted();
    console.log("[E2E] Environment ready");
  }

  async function stopProcess(running: RunningProcess): Promise<void> {
    signalProcess(running.child, "SIGTERM");
    const timeout = setTimeout(() => signalProcess(running.child, "SIGKILL"), 3_000);
    timeout.unref();
    try {
      await running.closed;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function teardown(): Promise<void> {
    controller.abort();
    try {
      await Promise.all([...processes].map(stopProcess));
      try {
        await startup;
      } catch {
        // Startup must settle before cleaning up resources it may have created.
      }
      if (composeStarted) {
        try {
          await runCommand({ file: "docker", args: [...composeArguments, "logs", "--no-color"], cleanup: true, timeout: 10_000 });
        } catch (error) {
          console.error("Unable to collect E2E database logs:", error);
          exitCode = 1;
        }
        await runCommand({
          file: "docker",
          args: [...composeArguments, "down", "--volumes"],
          cleanup: true,
          timeout: 30_000,
        });
      }
    } catch (error) {
      console.error("Unable to clean up the E2E environment:", error);
      exitCode = 1;
    } finally {
      if (log !== undefined) closeSync(log);
      finished.resolve(undefined);
    }
  }

  function stop(): Promise<void> {
    shutdown ??= teardown();
    return shutdown;
  }

  async function run(): Promise<number> {
    try {
      startup = start();
      await startup;
      await finished.promise;
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(error);
        exitCode = 1;
      }
      await stop();
    }
    return exitCode;
  }

  return { run, stop };
}

if (import.meta.main) {
  const environment = createEnvironment();
  const onSignal = () => void environment.stop();
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
  process.exitCode = await environment.run();
  process.removeListener("SIGTERM", onSignal);
  process.removeListener("SIGINT", onSignal);
}
