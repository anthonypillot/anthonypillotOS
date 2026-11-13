// @vitest-environment node
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { SpawnOptions } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseURL, databaseURL, secondaryBaseURL } from "../../e2e/support/configuration";
import { createEnvironment } from "../../e2e/support/server";

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
  openSync: vi.fn(),
  closeSync: vi.fn(),
  writeSync: vi.fn(),
  createServer: vi.fn(),
}));

vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
vi.mock("node:fs", () => ({
  openSync: mocks.openSync,
  closeSync: mocks.closeSync,
  writeSync: mocks.writeSync,
}));
vi.mock("node:fs/promises", () => ({ access: mocks.access, mkdir: mocks.mkdir }));
vi.mock("node:net", () => ({ createServer: mocks.createServer }));

class FakeChild extends EventEmitter {
  pid: number;
  stdout = new PassThrough();
  exitCode: number | null = null;
  signalCode: NodeJS.Signals | null = null;
  ignoreSigterm = false;
  private closed = false;

  constructor(pid: number) {
    super();
    this.pid = pid;
  }

  close(code: number | null, signal: NodeJS.Signals | null = null): void {
    if (this.closed) return;
    this.closed = true;
    this.exitCode = code;
    this.signalCode = signal;
    this.stdout.end();
    this.emit("exit", code, signal);
    this.emit("close", code, signal);
  }
}

type SpawnedCommand = {
  file: string;
  args: string[];
  options: SpawnOptions;
  child: FakeChild;
};

type CommandResult = {
  code?: number;
  output?: string;
  error?: Error;
  block?: boolean;
};

let commands: SpawnedCommand[];
let environments: ReturnType<typeof createEnvironment>[];
let resultForCommand: (command: SpawnedCommand) => CommandResult;
let occupiedPort: number | undefined;

function newEnvironment() {
  const environment = createEnvironment();
  environments.push(environment);
  return environment;
}

async function startEnvironment() {
  const environment = newEnvironment();
  const result = environment.run();
  await vi.waitFor(() => expect(console.log).toHaveBeenCalledWith("[E2E] Environment ready"));
  return { environment, result };
}

function composeCommands(action: string): SpawnedCommand[] {
  return commands.filter(command => command.file === "docker" && command.args.includes(action));
}

beforeEach(() => {
  vi.resetAllMocks();
  commands = [];
  environments = [];
  occupiedPort = undefined;
  resultForCommand = () => ({});
  vi.stubEnv("E2E_DATABASE_MODE", "managed");
  vi.stubEnv("POSTGRES_PRISMA_URL", "postgresql://developer:secret@localhost:5432/never_use");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ statusCode: 200 })));
  mocks.access.mockResolvedValue(undefined);
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.openSync.mockReturnValue(42);
  mocks.createServer.mockImplementation(() => {
    const server = new EventEmitter();
    return Object.assign(server, {
      listen(port: number, _host: string, callback: () => void) {
        queueMicrotask(() => {
          if (port === occupiedPort) server.emit("error", new Error("EADDRINUSE"));
          else callback();
        });
      },
      close(callback: () => void) {
        callback();
      },
    });
  });
  mocks.spawn.mockImplementation((file: string, args: string[], options: SpawnOptions) => {
    const child = new FakeChild(10_000 + commands.length);
    const command = { file, args, options, child };
    commands.push(command);
    const result = resultForCommand(command);
    if (!args.includes(".output/server/index.mjs") && !result.block) {
      queueMicrotask(() => {
        if (result.output) child.stdout.write(result.output);
        if (result.error) child.emit("error", result.error);
        child.close(result.error ? null : result.code ?? 0);
      });
    }
    return child;
  });
  vi.spyOn(process, "kill").mockImplementation((pid, signal) => {
    const command = commands.find(command => command.child.pid === -pid);
    if (!command) throw new Error(`Unowned process group: ${pid}`);
    if (signal !== "SIGTERM" || !command.child.ignoreSigterm) {
      command.child.close(null, signal === "SIGKILL" ? "SIGKILL" : "SIGTERM");
    }
    return true;
  });
});

afterEach(async () => {
  await Promise.all(environments.map(environment => environment.stop()));
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("E2E environment coordinator", () => {
  it("owns a unique Compose project and starts both isolated Nitro instances", async () => {
    const { environment, result } = await startEnvironment();
    const [up] = composeCommands("up");
    expect(up?.args).toEqual([
      "compose", "--project-name", expect.stringMatching(/^os-e2e-\d+-/),
      "--file", "tests/e2e/compose.yaml", "up", "--detach", "--wait", "--wait-timeout", "90",
    ]);
    const applications = commands.filter(command => command.args.includes(".output/server/index.mjs"));
    expect(applications.map(command => command.options.env?.PORT)).toEqual(["4173", "4174"]);
    expect(applications.map(command => command.options.env?.NITRO_PORT)).toEqual(["4173", "4174"]);
    expect(commands.every(command => command.options.env?.POSTGRES_PRISMA_URL === databaseURL)).toBe(true);
    expect(commands.some(command => command.args.includes("tests/e2e/support/setup-database.ts"))).toBe(true);
    expect(fetch).toHaveBeenCalledWith(`${baseURL}/api/health/ready`, expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(`${secondaryBaseURL}/api/health/ready`, expect.any(Object));

    const stopping = environment.stop();
    expect(environment.stop()).toBe(stopping);
    await stopping;
    expect(await result).toBe(0);
    expect(composeCommands("logs")).toHaveLength(1);
    expect(composeCommands("down")).toHaveLength(1);
    expect(composeCommands("down")[0]?.args.slice(0, 5)).toEqual(up?.args.slice(0, 5));
    expect(process.kill).toHaveBeenCalledTimes(2);
  });

  it("does not manage Docker in explicit external mode", async () => {
    vi.stubEnv("E2E_DATABASE_MODE", "external");
    const { environment, result } = await startEnvironment();
    await environment.stop();
    expect(await result).toBe(0);
    expect(commands.some(command => command.file === "docker")).toBe(false);
    expect(commands.filter(command => command.args.includes("tests/e2e/support/setup-database.ts"))).toHaveLength(1);
  });

  it("does not infer external mode from CI", async () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("E2E_DATABASE_MODE", undefined);
    const { environment, result } = await startEnvironment();
    expect(composeCommands("up")).toHaveLength(1);
    await environment.stop();
    expect(await result).toBe(0);
  });

  it("rejects invalid database modes before starting processes", async () => {
    vi.stubEnv("E2E_DATABASE_MODE", "auto");
    expect(await newEnvironment().run()).toBe(1);
    expect(commands).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
      message: "E2E_DATABASE_MODE must be managed or external",
    }));
  });

  it("reports a missing build without provisioning a database", async () => {
    mocks.access.mockRejectedValue(new Error("ENOENT"));
    expect(await newEnvironment().run()).toBe(1);
    expect(commands).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("run npm run build"),
    }));
  });

  it.each([4173, 4174, 55439])("rejects an occupied port %s without touching its owner", async (port) => {
    occupiedPort = port;
    expect(await newEnvironment().run()).toBe(1);
    expect(commands).toHaveLength(0);
    expect(process.kill).not.toHaveBeenCalled();
  });

  it("rejects an existing container without removing or adopting it", async () => {
    resultForCommand = command => command.args.includes("ps") ? { output: "os-e2e-postgres\n" } : {};
    expect(await newEnvironment().run()).toBe(1);
    expect(composeCommands("up")).toHaveLength(0);
    expect(composeCommands("down")).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("E2E_DATABASE_MODE=external"),
    }));
  });

  it("cleans up its own Compose project after partially failed provisioning", async () => {
    resultForCommand = command => command.args.includes("up") ? { code: 1 } : {};
    expect(await newEnvironment().run()).toBe(1);
    expect(composeCommands("down")[0]?.args.slice(0, 5)).toEqual(composeCommands("up")[0]?.args.slice(0, 5));
    expect(commands.some(command => command.args.includes(".output/server/index.mjs"))).toBe(false);
  });

  it("cleans up the database when schema initialization fails", async () => {
    resultForCommand = command => command.args.includes("tests/e2e/support/setup-database.ts") ? { code: 1 } : {};
    expect(await newEnvironment().run()).toBe(1);
    expect(composeCommands("down")).toHaveLength(1);
    expect(commands.some(command => command.args.includes(".output/server/index.mjs"))).toBe(false);
  });

  it("reports process spawn errors without waiting for the command timeout", async () => {
    resultForCommand = () => ({ error: new Error("Docker is unavailable") });
    expect(await newEnvironment().run()).toBe(1);
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Docker is unavailable" }));
    expect(composeCommands("down")).toHaveLength(0);
  });

  it("waits for database readiness in the secondary server's JSON body", async () => {
    let secondaryReady = false;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json({
      statusCode: url.startsWith(secondaryBaseURL) && !secondaryReady ? 503 : 200,
    })));
    const environment = newEnvironment();
    const result = environment.run();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith(`${secondaryBaseURL}/api/health/ready`, expect.any(Object)));
    expect(console.log).not.toHaveBeenCalledWith("[E2E] Environment ready");
    secondaryReady = true;
    await vi.waitFor(() => expect(console.log).toHaveBeenCalledWith("[E2E] Environment ready"));
    await environment.stop();
    expect(await result).toBe(0);
  });

  it("cleans up when readiness exceeds its deadline", async () => {
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now += 60_001);
    expect(await newEnvironment().run()).toBe(1);
    expect(composeCommands("down")).toHaveLength(1);
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("did not become database-ready"),
    }));
  });

  it("cancels provisioning and removes only the attempted Compose project", async () => {
    resultForCommand = command => command.args.includes("up") ? { block: true } : {};
    const environment = newEnvironment();
    const result = environment.run();
    await vi.waitFor(() => expect(composeCommands("up")).toHaveLength(1));
    await environment.stop();
    expect(await result).toBe(0);
    expect(composeCommands("down")).toHaveLength(1);
    expect(commands.some(command => command.args.includes(".output/server/index.mjs"))).toBe(false);
  });

  it("cancels readiness polling and stops both servers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ statusCode: 503 })));
    const environment = newEnvironment();
    const result = environment.run();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await environment.stop();
    expect(await result).toBe(0);
    expect(process.kill).toHaveBeenCalledTimes(2);
    expect(console.log).not.toHaveBeenCalledWith("[E2E] Environment ready");
  });

  it("stops the sibling server after an unexpected application exit", async () => {
    const { result } = await startEnvironment();
    const application = commands.find(command => command.args.includes(".output/server/index.mjs"));
    application?.child.close(0);
    expect(await result).toBe(1);
    expect(process.kill).toHaveBeenCalledTimes(1);
    expect(composeCommands("down")).toHaveLength(1);
  });

  it("forcefully terminates a server that ignores SIGTERM", async () => {
    const { environment, result } = await startEnvironment();
    const application = commands.find(command => command.args.includes(".output/server/index.mjs"));
    if (!application) throw new Error("Expected a running application");
    application.child.ignoreSigterm = true;
    vi.useFakeTimers();
    const stopping = environment.stop();
    expect(process.kill).not.toHaveBeenCalledWith(-application.child.pid, "SIGKILL");
    await vi.advanceTimersByTimeAsync(3_000);
    await stopping;
    expect(await result).toBe(0);
    expect(process.kill).toHaveBeenCalledWith(-application.child.pid, "SIGKILL");
  });

  it("bounds command startup time", async () => {
    vi.useFakeTimers();
    resultForCommand = command => command.args.includes("info") ? { block: true } : {};
    const environment = newEnvironment();
    const result = environment.run();
    await vi.waitFor(() => expect(commands).toHaveLength(1));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await result).toBe(1);
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("timed out"),
    }));
  });

  it("still removes its database if log collection fails", async () => {
    const { environment, result } = await startEnvironment();
    resultForCommand = command => command.args.includes("logs") ? { code: 1 } : {};
    await environment.stop();
    expect(await result).toBe(1);
    expect(composeCommands("down")).toHaveLength(1);
  });
});
