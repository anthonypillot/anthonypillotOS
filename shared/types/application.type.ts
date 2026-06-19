/**
 * Descriptor for a tool page hosted under `/tools/<id>`.
 *
 * `favicon` is the icon shown when the browser reports `prefers-color-scheme: light`.
 * `faviconDark` is the icon shown when the browser reports `prefers-color-scheme: dark`.
 * When `faviconDark` is unset, only the light-mode icon is emitted.
 */
export type Application = {
  id: string;
  name: string;
  description: string;
  path: string;
  favicon: string;
  faviconDark?: string;
};
