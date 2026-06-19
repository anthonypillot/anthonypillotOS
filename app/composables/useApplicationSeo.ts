/**
 * Sets up SEO metadata for a tool page from an `Application` descriptor.
 *
 * @param app - The application descriptor (must include `name`, `description`, and `favicon`).
 */
export default function (app: Application): void {
  useSeo({
    title: app.name,
    description: app.description,
    favicon: {
      type: "image/svg",
      href: app.favicon,
    },
  });
}
