## 1. Shared data and types

- [x] 1.1 Add `shared/types/it-facts.type.ts` exporting `ItFact`, `ItFactsApplication` constant (`{ id: "it-facts", name, description, path: "/tools/it-facts/application" }`), and any other helpers used by both client and server.
- [x] 1.2 Add `shared/data/it-facts.data.ts` exporting `itFacts: readonly ItFact[]` with at least 20 hand-written facts; each entry has `id`, `statement`, `isTrue`, `explanation`, and an optional `source`.

## 2. Best-score composable

- [x] 2.1 Add `app/composables/useItFactsScore.ts` (default export) returning `{ best: ComputedRef<number>, save: (score: number) => void }`. The composable MUST read from `localStorage.getItem("it-facts:best")`, default to `0`, treat malformed values as `0`, and `save()` only when the new score strictly exceeds the current best.
- [x] 2.2 Guard all `localStorage` access with `import.meta.client` checks so the composable is SSR-safe.

## 3. Components

- [x] 3.1 Add `app/components/it-facts/ItFactsHero.vue` with a copy block, a gradient/blur background matching `HistoryCleanerHero.vue`, and a `UButton as="a"` "Launch IT Facts" that links to `itFactsApplication.path`.
- [x] 3.2 Add `app/components/it-facts/ItFactsGame.vue` implementing the state machine (`idle | playing | feedback | finished`), progress indicator, True/False `UButton`s, per-question feedback (correct/incorrect text + explanation), a Next control, and embedding `<ItFactsResult />` when status is `finished`.
- [x] 3.3 Add `app/components/it-facts/ItFactsResult.vue` showing the round score, the all-time best score (from `useItFactsScore()`), and a `UButton` "Play again" that resets the parent game.

## 4. Pages

- [x] 4.1 Add `app/pages/tools/it-facts/index.vue` (landing) mounting `<ItFactsHero />` and calling `useSeo({ title: itFactsApplication.name, description, favicon: { type: "image/svg", href: "/svg/it-facts/logo.svg" } })`.
- [x] 4.2 Add `app/pages/tools/it-facts/application.vue` mounting `<ItFactsGame />` and calling the same `useSeo(...)` as the landing page.

## 5. Discoverability and routing

- [x] 5.1 Add a third entry in the `tools` array of `app/pages/tools/index.vue` for "IT Facts" with `to: "/tools/it-facts"` (landing) and an unused `i-heroicons-*` icon.
- [x] 5.2 Add a third entry in `popover.links` of `app/components/base/Header.vue` matching the same fields (links to the landing).
- [x] 5.3 Add `"/tools/it-facts": { swr: true }` to `routeRules` in `nuxt.config.ts`.

## 6. Optional illustration

- [x] 6.1 Add `public/svg/it-facts/logo.svg` (a minimal hand-rolled check/cross glyph) and reference it from the page `useSeo` favicon. Skip this task if shipping without an illustration; the page still renders without it.

## 7. End-to-end test

- [x] 7.1 Add `itFacts: createConfig(itFactsApplication.path)` and `itFactsLanding: createConfig("/tools/it-facts")` to the `application` object in `tests/e2e/configuration.ts`.
- [x] 7.2 Add `tests/e2e/pages/tools/it-facts/index.test.ts` with three Playwright tests split across both pages: landing shows the hero and a Launch IT Facts control but NOT the game heading; the application page starts a round and shows the first fact; the application page reaches the result screen after 10 answers and allows a new round.

## 8. Verification

- [x] 8.1 Run `npm run lint` and ensure it passes (`nuxt typecheck && eslint .`).
- [x] 8.2 Run `npm run dev:detached`, manually visit `/tools/it-facts`, follow the Launch link to `/tools/it-facts/application`, complete a round, refresh the page, and confirm the best score persists.
- [x] 8.3 Run `npm run test:e2e` locally (or scoped to the new test file) to confirm the Playwright suite passes against the running dev server.
