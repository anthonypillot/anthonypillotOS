export function withServiceVersion(attributes: string | undefined, version: string): string {
  const preservedAttributes = (attributes ?? "")
    .split(",")
    .map(attribute => attribute.trim())
    .filter(attribute => attribute && attribute.split("=", 1)[0]?.trim() !== "service.version");

  return [...preservedAttributes, `service.version=${encodeURIComponent(version)}`].join(",");
}
