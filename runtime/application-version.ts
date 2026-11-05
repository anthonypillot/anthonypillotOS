import packageJson from "../package.json" with { type: "json" };

export function getApplicationVersion(): string {
  return process.env.APP_VERSION?.trim() || packageJson.version;
}
