import { createRequire } from "node:module";
import { getApplicationVersion } from "./application-version.ts";
import { withServiceVersion } from "./telemetry-resource.ts";

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) {
  process.env.OTEL_RESOURCE_ATTRIBUTES = withServiceVersion(
    process.env.OTEL_RESOURCE_ATTRIBUTES,
    getApplicationVersion(),
  );

  // Load the SDK only after the image's version has been added to its resource.
  createRequire(import.meta.url)("@opentelemetry/auto-instrumentations-node/register");
}
