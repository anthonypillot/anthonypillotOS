## Why

The IT Facts and Task Hold'em tool pages each set a single `<link rel="icon">` whose asset is a **white silhouette** (e.g. `public/svg/it-facts/logo.svg`, `public/svg/task-holdem/poker-hand.svg`). In dark browser chrome those icons pop, but in light browser chrome a white-on-white favicon is invisible. `@nuxt/ui` already auto-applies `.light`/`.dark` on `<html>` from the OS preference — the favicon should follow the same signal.

## What Changes

- Extend the `Application` type with an **optional** `faviconDark?: string` field. The existing `favicon: string` keeps its meaning: the icon shown when the browser is in **light** mode. `faviconDark` is the icon shown in **dark** mode. Non-breaking — only the two `*Application` constants add a new field.
- Update `app/composables/useApplicationSeo.ts` so that, when `faviconDark` is set, it emits **two** `<link rel="icon">` tags with `media="(prefers-color-scheme: light)"` and `media="(prefers-color-scheme: dark)"`. The browser picks the matching one at parse time — no JS, no hydration risk, works under SWR and static export.
- Add a dark-fill (light-mode) variant of each existing favicon: `public/svg/it-facts/logo-light.svg` and `public/svg/task-holdem/poker-hand-light.svg`. Re-use the existing white assets as the dark-mode variants.
- Wire `faviconDark` into `itFactsApplication` and `taskHoldemApplication` in `shared/types/`.

Out of scope (no change): the site-wide `/favicon.ico`, the GitHub History Cleaner page, color-mode toggles, the `useSeo()` defaults, server-side assets, dependencies.

## Capabilities

### New Capabilities

- `application-favicon`: Defines the favicon contract for the `Application` type and the per-scheme `<link>` emission contract used by `useApplicationSeo`. The capability specifies that any application whose favicon is a white silhouette (i.e. designed for dark browser chrome) MUST supply a `faviconDark` field, and that `useApplicationSeo` MUST emit one `<link rel="icon" media="(prefers-color-scheme: light)">` and one `<link rel="icon" media="(prefers-color-scheme: dark)">` when the field is set.

### Modified Capabilities

- None. There are no existing main `openspec/specs/` capabilities; both `it-facts-game` and `task-holdem` only have delta specs inside their (archived) change directories and are not affected at the requirement level by this change.

## Impact

- **Types**: `shared/types/application.type.ts` (add `faviconDark?: string`); `shared/types/it-facts.type.ts` and `shared/types/task-holdem.type.ts` (populate the new field).
- **Composable**: `app/composables/useApplicationSeo.ts` (emit dual `<link>` tags).
- **Assets**: `public/svg/it-facts/logo-light.svg` (new), `public/svg/task-holdem/poker-hand-light.svg` (new). Existing white assets keep their paths.
- **Call sites**: none — `useApplicationSeo` is called from `app/pages/tools/it-facts/index.vue`, `app/pages/tools/it-facts/application.vue`, `app/pages/tools/task-holdem/index.vue`, `app/pages/tools/task-holdem/application.vue` and continues to receive the same `Application` shape; the dual-`<link>` behavior is internal to the composable.
- **Build / CI / Docker / E2E**: no changes. `npm run lint` is the only command needed for verification; no Playwright coverage added (manual visual check via macOS appearance toggle).
