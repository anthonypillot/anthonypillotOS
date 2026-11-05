import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../../package.json" with { type: "json" };
import { getApplicationVersion } from "../../../runtime/application-version";
import { withServiceVersion } from "../../../runtime/telemetry-resource";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("application version", () => {
  it("uses the version embedded in the image", () => {
    vi.stubEnv("APP_VERSION", " preview-telemetry ");

    expect(getApplicationVersion()).toBe("preview-telemetry");
  });

  it.each([undefined, "", "   "])("falls back to the original manifest for %s", (value) => {
    vi.stubEnv("APP_VERSION", value);

    expect(getApplicationVersion()).toBe(packageJson.version);
  });
});

describe("telemetry resource", () => {
  it.each([undefined, "", " , "])("adds a version to empty attributes %s", (attributes) => {
    expect(withServiceVersion(attributes, "1.2.3")).toBe("service.version=1.2.3");
  });

  it("preserves service, environment and encoded custom attributes", () => {
    const attributes = "service.name=OS,deployment.environment=staging,custom.value=a%2Cb%3Dc";

    expect(withServiceVersion(attributes, "1.2.3")).toBe(`${attributes},service.version=1.2.3`);
  });

  it("replaces stale and duplicate version attributes without touching similarly named keys", () => {
    const attributes = "service.version = old,service.version=older,custom.service.version=keep";

    expect(withServiceVersion(attributes, "1.2.3")).toBe("custom.service.version=keep,service.version=1.2.3");
  });

  it("encodes delimiters and remains idempotent", () => {
    const attributes = withServiceVersion("service.name=OS", "preview,a=b");

    expect(attributes).toBe("service.name=OS,service.version=preview%2Ca%3Db");
    expect(withServiceVersion(attributes, "preview,a=b")).toBe(attributes);
  });

  it.each(["", "   "])("does not initialize the SDK without an endpoint (%s)", (endpoint) => {
    const register = resolve("runtime/register-telemetry.mts");
    const output = execFileSync(process.execPath, [
      "--import", register, "--input-type=module", "--eval",
      "console.log(process.env.OTEL_RESOURCE_ATTRIBUTES); console.log(process.listenerCount('SIGTERM'));",
    ], {
      encoding: "utf8",
      env: { OTEL_EXPORTER_OTLP_ENDPOINT: endpoint, OTEL_RESOURCE_ATTRIBUTES: "custom.key=preserved" },
    });

    expect(output.trim().split("\n")).toEqual(["custom.key=preserved", "0"]);
  });

  it("sets the image version before initializing the SDK once", () => {
    const register = resolve("runtime/register-telemetry.mts");
    const output = execFileSync(process.execPath, [
      "--import", register, "--import", register, "--input-type=module", "--eval",
      "console.log(process.env.OTEL_RESOURCE_ATTRIBUTES); console.log(process.listenerCount('SIGTERM'));",
    ], {
      encoding: "utf8",
      env: {
        APP_VERSION: "preview-telemetry",
        OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:1",
        OTEL_TRACES_EXPORTER: "none",
        OTEL_METRICS_EXPORTER: "none",
        OTEL_LOGS_EXPORTER: "none",
        OTEL_NODE_RESOURCE_DETECTORS: "env",
        OTEL_RESOURCE_ATTRIBUTES: "service.name=OS,service.version=stale,deployment.environment=staging",
      },
    });

    expect(output.trim().split("\n")).toEqual([
      "service.name=OS,deployment.environment=staging,service.version=preview-telemetry",
      "1",
    ]);
  });
});
