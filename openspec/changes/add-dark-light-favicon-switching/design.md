## Context

The `Application` type (shared/types/application.type.ts:6) currently exposes a single `favicon: string`. `useApplicationSeo` (app/composables/useApplicationSeo.ts:6-15) feeds that string into `useSeo`, which sets a single `<link rel="icon">` via `useHead` (app/composables/useSeo.ts:36-48). The two tool applications — IT Facts and Task Hold'em — each have a white silhouette SVG (`public/svg/it-facts/logo.svg`, `public/svg/task-holdem/poker-hand.svg`) referenced as `favicon`.

Nuxt UI v4 already applies `.light` / `.dark` on `<html>` from the OS `prefers-color-scheme` signal. No explicit color-mode toggle exists in the project, and we are not adding one — the favicon must simply follow the same browser/OS signal.

The W3C-blessed mechanism is two `<link rel="icon">` elements with the `media` attribute (`(prefers-color-scheme: light)` / `(prefers-color-scheme: dark)`). The browser picks the matching one at parse time, so the swap is purely declarative and works under SWR, static export, and SSR without hydration concerns.

## Goals / Non-Goals

**Goals:**
- The IT Facts and Task Hold'em pages show a visible, theme-appropriate favicon in both light and dark browser chrome.
- The implementation is fully declarative (`<link media="…">`) — no JS, no `useColorMode` reactivity, no hydration risk.
- The `Application` type stays backwards-compatible — adding `faviconDark` is optional, so future applications without a dual-asset need are unaffected.
- The change is internalised by `useApplicationSeo` — existing call sites in `app/pages/tools/it-facts/*` and `app/pages/tools/task-holdem/*` need no edits.

**Non-Goals:**
- Adding a manual light/dark toggle UI in the header.
- Changing the site-wide `/favicon.ico` or the GitHub History Cleaner favicon.
- Changing `useSeo()`'s default-args contract (which is used by the home page, error page, etc.).
- Restructuring the `public/svg/` directory.
- Adding automated E2E coverage — manual visual verification via macOS appearance toggle is sufficient per the user's decision.

## Decisions

### 1. Use the native `<link media="(prefers-color-scheme: …)">` pattern, not JS reactivity
- **Why**: The browser picks the correct favicon at parse time; no JS execution or `useColorMode()` subscription is needed. This works identically under SSR, SWR (`routeRules: { swr: true }` on `/tools/*`), and `nuxt generate`.
- **Alternative considered**: read `useColorMode()` and mutate the `<link href>` reactively. Rejected — requires a client-only `onMounted` swap, risks a flash of the wrong favicon, and complicates SWR payloads.

### 2. Extend `Application` with `faviconDark?: string` (optional) instead of replacing `favicon`
- **Why**: Non-breaking. Only the two `*Application` constants populate the new field; future apps that ship a single neutral favicon need nothing more.
- **Alternative considered**: replace `favicon: string` with `favicon: { light: string; dark: string }`. Rejected — it's a breaking change with no benefit; the optional form is strictly more flexible.

### 3. `favicon` keeps its meaning as the **light-mode** icon; `faviconDark` is the **dark-mode** icon
- **Why**: Matches the existing field naming. The existing white SVGs become the `faviconDark` (designed for dark browser chrome) and a new dark-fill SVG becomes `favicon` (designed for light browser chrome). This is the same convention used elsewhere in the project: `nuxt.config.ts` already has `logo.hero.white` / `logo.hero.black` pairs.
- **Alternative considered**: rename the existing white files to `*-dark.svg` and reuse the bare name for the dark variant. Rejected — would break any future external references to the existing paths and required a rename in the archived `add-it-facts-true-false` change's `tasks.md` for the existing `logo.svg`.

### 4. Author the new `-light.svg` files by editing the existing SVGs
- **Why**: The two existing SVGs are simple `<path fill="#FFFFFF">` shapes. Re-using the same paths with `fill="#0f172a"` (a slate-900 from the Tailwind default palette) gives a faithful dark variant with zero new design work and keeps the `viewBox` / proportions identical.
- **Alternative considered**: design a brand-new light-mode logo. Rejected — outside the scope of this change; the existing white shapes are recognisable in either fill.

### 5. Keep all favicon emission inside `useApplicationSeo`, do not touch `useSeo`
- **Why**: The dual-`<link>` behaviour is specific to tool pages that flow through an `Application` descriptor. The home page and GitHub History Cleaner use `useSeo()` directly with no `Application`, so they retain the single `<link>` (and `/favicon.ico`) behaviour — no regression risk.

## Risks / Trade-offs

- **`useHead` and `useSeoMeta` integration with `useApplicationSeo`**. [Risk] → Currently `useApplicationSeo` calls `useSeo({...})`, which calls `useHead` with a single `link` array. If we keep that shape and only add a second link, we have two options: (a) move the `link` array out of `useSeo` and rebuild it inside `useApplicationSeo`, or (b) extend `useSeo` to accept an array of `favicons`. Mitigation: pick option (a) — `useApplicationSeo` becomes responsible for emitting its own `<link>` array via a direct `useHead` call, leaving `useSeo` unchanged. The single-favicon fallback for `useSeo()` (no args) and `useSeo({favicon: ...})` continues to work.

- **Single `key: "favicon"` collides on two `<link>` tags**. [Risk] → Vue/Head deduplicates `<link>` by `key`; emitting two `key: "favicon"` entries would drop one. Mitigation: use distinct keys, e.g. `favicon-light` and `favicon-dark`.

- **Browser support for `media` on `<link rel="icon">`**. [Risk] → Older browsers (no media-query support on `<link>`) fall back to the first matching link. Mitigation: emit the light-mode `<link>` first so the default (no media match → no `<link media>` applies) is the light icon. Both Chrome, Safari, Firefox (current) handle `media` on `<link rel="icon">` per HTML living standard; users on obsolete browsers simply see the light-mode icon, which is the conservative default.

- **SWR-cached payload contains both `<link>` tags**. [Risk] → None. SWR caches the rendered HTML payload; the two `<link>` tags are static and present at first paint, so the browser honours the media query immediately. No client-side computation is involved.

- **Existing archived change references the old `favicon` path**. [Risk] → `openspec/changes/add-it-facts-true-false/tasks.md` mentions `/svg/it-facts/logo.svg`; the new mapping still uses that path for `faviconDark`, so the reference remains accurate. No update needed to the archived change.

## Migration Plan

- No data migration, no DB schema change, no flag flip.
- Deploy is a single PR; rollback is `git revert` of the PR.
- Manual smoke test (post-merge, on `prep.anthonypillot.com`):
  1. Open `/tools/it-facts/application` in Safari with macOS in **light** appearance — confirm the dark `IF` wordmark shows in the tab.
  2. Toggle macOS to **dark** appearance (or use Safari's "Appearance" DevTools menu) — confirm the white `IF` wordmark shows in the tab.
  3. Repeat for `/tools/task-holdem/application` (poker-hand glyph).

## Open Questions

None. All meaningful product decisions (scope, naming, asset layout, E2E coverage) were resolved with the user during planning. The only remaining discretion is the exact dark `fill` value used in the two new `-light.svg` files — `oklch(0.2)` / `#0f172a` (slate-900) is the proposed default but can be adjusted in code review.
