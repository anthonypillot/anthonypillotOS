/**
 * Sets up SEO metadata for a tool page from an `Application` descriptor.
 *
 * Emits one `<link rel="icon">` with `media="(prefers-color-scheme: light)"` from
 * `app.favicon`, and — when `app.faviconDark` is set — a second `<link rel="icon">`
 * with `media="(prefers-color-scheme: dark)"` from `app.faviconDark`. The browser
 * picks the matching link at parse time, so no JS or hydration is involved.
 *
 * The light link reuses the `key: "favicon"` slot so it replaces the default
 * `<link rel="icon" href="/favicon.ico">` emitted by the root layout's `useSeo()`.
 *
 * @param app - The application descriptor (must include `name`, `description`, and
 *   `favicon`; `faviconDark` is optional).
 */
export default function (app: Application): void {
  useSeo({
    title: app.name,
    description: app.description,
  });

  const links: Array<Record<string, string>> = [
    {
      key: "favicon",
      rel: "icon",
      type: "image/svg+xml",
      href: app.favicon,
      media: "(prefers-color-scheme: light)",
    },
  ];

  if (app.faviconDark) {
    links.push({
      key: "favicon-dark",
      rel: "icon",
      type: "image/svg+xml",
      href: app.faviconDark,
      media: "(prefers-color-scheme: dark)",
    });
  }

  useHead({ link: links });
}
