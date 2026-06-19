## 1. Extend the Application type

- [ ] 1.1 In `shared/types/application.type.ts`, add the optional field `faviconDark?: string;` to the `Application` type. Document both fields' semantic meaning (light vs. dark browser chrome) in a short JSDoc comment.

## 2. Author the light-mode SVG variants

- [ ] 2.1 Create `public/svg/it-facts/logo-light.svg` by copying the contents of `public/svg/it-facts/logo.svg` and replacing the outer `<g fill="#ffffff">` (and any inner `fill="#ffffff"` attributes) with `fill="#0f172a"`. Keep the same `viewBox`, `<title>`, and `<path>` data so the wordmark shape is identical.
- [ ] 2.2 Create `public/svg/task-holdem/poker-hand-light.svg` by copying the contents of `public/svg/task-holdem/poker-hand.svg` and replacing `fill="#FFFFFF"` with `fill="#0f172a"`. Keep the same `viewBox` and `<path>` data.

## 3. Wire faviconDark into the Application constants

- [ ] 3.1 In `shared/types/it-facts.type.ts`, set `faviconDark: "/svg/it-facts/logo.svg"` (the existing white asset) and update `favicon` to `"/svg/it-facts/logo-light.svg"`.
- [ ] 3.2 In `shared/types/task-holdem.type.ts`, set `faviconDark: "/svg/task-holdem/poker-hand.svg"` (the existing white asset) and update `favicon` to `"/svg/task-holdem/poker-hand-light.svg"`.

## 4. Update useApplicationSeo to emit per-scheme link tags

- [ ] 4.1 In `app/composables/useApplicationSeo.ts`, stop delegating the favicon `<link>` to `useSeo` and instead call `useHead` directly. Emit one `<link rel="icon" type="image/svg+xml" href={app.favicon} media="(prefers-color-scheme: light)" key="favicon-light">` and, when `app.faviconDark` is set, a second `<link rel="icon" type="image/svg+xml" href={app.faviconDark} media="(prefers-color-scheme: dark)" key="favicon-dark">`. Use distinct `key` values so Unhead does not deduplicate them. Preserve the existing `useSeo` calls for `title` and `description` (delegate those to `useSeo({ title, description })` so the title/description/og meta behaviour is unchanged).
- [ ] 4.2 Confirm `useSeo()` (no args) and `useSeo({ favicon: {...} })` call sites in `app/app.vue` and `app/pages/tools/github/history-cleaner.vue` still emit exactly one `<link rel="icon">` with the supplied `favicon` (or `/favicon.ico` when unset) and no `media` attribute — no change should be required.

## 5. Verify

- [ ] 5.1 Run `npm run lint` and confirm both `nuxt typecheck` and `eslint .` pass.
- [ ] 5.2 Build the production bundle locally with `npm run build` and confirm no head-related warnings are emitted by Unhead/Vue.
- [ ] 5.3 Start the dev server (manually, per AGENTS.md), visit `/tools/it-facts/application` and `/tools/task-holdem/application`, inspect the document head in DevTools, and confirm two `<link rel="icon">` elements are present with the correct `media` and `href` values.
- [ ] 5.4 Toggle macOS appearance between light and dark, reload each of the four pages (`/tools/it-facts`, `/tools/it-facts/application`, `/tools/task-holdem`, `/tools/task-holdem/application`), and confirm the favicon in the browser tab swaps accordingly.
