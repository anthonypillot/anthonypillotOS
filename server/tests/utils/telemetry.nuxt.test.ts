import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../../package.json" with { type: "json" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function runTelemetry(environment: NodeJS.ProcessEnv): string[] {
  const register = resolve("server/register-telemetry.ts");
  const output = execFileSync(process.execPath, [
    "--import", register, "--import", register, "--input-type=module", "--eval",
    "console.log(process.env.OTEL_RESOURCE_ATTRIBUTES); console.log(process.listenerCount('SIGTERM'));",
  ], {
    encoding: "utf8",
    timeout: 10_000,
    env: {
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:1",
      OTEL_TRACES_EXPORTER: "none",
      OTEL_METRICS_EXPORTER: "none",
      OTEL_LOGS_EXPORTER: "none",
      OTEL_NODE_RESOURCE_DETECTORS: "env",
      ...environment,
    },
  });

  return output.trim().split("\n");
}

describe("telemetry preload", () => {
  it("sets the image version before initializing the SDK once", () => {
    expect(runTelemetry({ APP_VERSION: " preview-telemetry " })).toEqual([
      "service.version=preview-telemetry",
      "1",
    ]);
  });

  it.each([undefined, "", "   "])("falls back to the original manifest for %s", (value) => {
    expect(runTelemetry({ APP_VERSION: value })).toEqual([
      `service.version=${packageJson.version}`,
      "1",
    ]);
  });

  it.each([undefined, "", " , "])("adds a version to empty attributes %s", (attributes) => {
    expect(runTelemetry({ APP_VERSION: "1.2.3", OTEL_RESOURCE_ATTRIBUTES: attributes })).toEqual([
      "service.version=1.2.3",
      "1",
    ]);
  });

  it("preserves namespace, environment and encoded custom attributes", () => {
    const attributes = "service.name=OS,service.namespace=os-stg,deployment.environment=staging,deployment.environment.name=staging,custom.value=a%2Cb%3Dc";

    expect(runTelemetry({ APP_VERSION: "1.2.3", OTEL_RESOURCE_ATTRIBUTES: attributes })).toEqual([
      `${attributes},service.version=1.2.3`,
      "1",
    ]);
  });

  it("replaces stale and duplicate version attributes without touching similarly named keys", () => {
    const attributes = "service.version = old,service.version=older,custom.service.version=keep";

    expect(runTelemetry({ APP_VERSION: "1.2.3", OTEL_RESOURCE_ATTRIBUTES: attributes })).toEqual([
      "custom.service.version=keep,service.version=1.2.3",
      "1",
    ]);
  });

  it("encodes delimiters and keeps an existing image version unique", () => {
    expect(runTelemetry({
      APP_VERSION: "preview,a=b",
      OTEL_RESOURCE_ATTRIBUTES: "service.name=OS,service.version=preview%2Ca%3Db",
    })).toEqual([
      "service.name=OS,service.version=preview%2Ca%3Db",
      "1",
    ]);
  });

  it.each([undefined, "", "   "])("does not initialize the SDK without an endpoint (%s)", (endpoint) => {
    expect(runTelemetry({
      OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
      OTEL_RESOURCE_ATTRIBUTES: "custom.key=preserved",
    })).toEqual(["custom.key=preserved", "0"]);
  });
});

describe("JSON log version", () => {
  it.each([undefined, "", "   ", " preview-telemetry "])("uses the image version or the original manifest for %s", async (value) => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_VERSION", value);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { logger } = await import("../../utils/logger");

    logger.info("Version test");

    expect(log).toHaveBeenCalledOnce();
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      version: value?.trim() || packageJson.version,
      message: "Version test",
    });
  });
});
