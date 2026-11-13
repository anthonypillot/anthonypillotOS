import { createRequire } from "node:module";
import packageJson from "../package.json" with { type: "json" };

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) {
  const version = process.env.APP_VERSION?.trim() || packageJson.version;
  const attributes = (process.env.OTEL_RESOURCE_ATTRIBUTES || "")
    .split(",")
    .map(attribute => attribute.trim())
    .filter(attribute => attribute && attribute.split("=", 1)[0]?.trim() !== "service.version");

  process.env.OTEL_RESOURCE_ATTRIBUTES = [...attributes, `service.version=${encodeURIComponent(version)}`].join(",");

  // Load the SDK only after the image's version has been added to its resource.
  createRequire(import.meta.url)("@opentelemetry/auto-instrumentations-node/register");
}
