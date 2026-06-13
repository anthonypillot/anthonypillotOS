## 1. Shared data and types

- [ ] 1.1 Add `shared/types/it-facts.type.ts` exporting `ItFact`, `ItFactsApplication` constant (`{ id: "it-facts", name, description, path: "/tools/it-facts" }`), and any other helpers used by both client and server.
- [ ] 1.2 Add `shared/data/it-facts.data.ts` exporting `itFacts: readonly ItFact[]` with at least 20 hand-written facts; each entry has `id`, `statement`, `isTrue`, `explanation`, and an optional `source`.

## 2. Best-score composable

- [ ] 2.1 Add `app/composables/useItFactsScore.ts` (default export) returning `{ best: ComputedRef<number>, save: (score: number) => void }`. The composable MUST read from `localStorage.getItem("it-facts:best")`, default to `0`, treat malformed values as `0`, and `save()` only when the new score strictly exceeds the current best.
- [ ] 2.2 Guard all `localStorage` access with a `typeof window !== "undefined"` check so the composable is SSR-safe.

## 3. Components

- [ ] 3.1 Add `app/components/it-facts/ItFactsHero.vue` with a copy block, a gradient/blur background matching `HistoryCleanerHero.vue`, and a `UButton` "Start a round" that scrolls to `#it-facts-game` and emits/requests a reset.
- [ ] 3.2 Add `app/components/it-facts/ItFactsGame.vue` implementing the state machine (`idle | playing | feedback | finished`), progress indicator, True/False `UButton`s, per-question feedback (correct/incorrect text + explanation), a Next control, and embedding `<ItFactsResult />` when status is `finished`.
- [ ] 3.3 Add `app/components/it-facts/ItFactsResult.vue` showing the round score, the all-time best score (from `useItFactsScore()`), and a `UButton` "Play again" that resets the parent game.

## 4. Page

- [ ] 4.1 Add `app/pages/tools/it-facts/index.vue` mounting `<ItFactsHero />` + `<ItFactsGame />` and calling `useSeo({ title, description, favicon: { type: "image/svg", href: "/svg/it-facts/true-false.svg" } })`.

## 5. Discoverability and routing

- [ ] 5.1 Add a third entry in the `tools` array of `app/pages/tools/index.vue` for "IT Facts True/False" with `to: "/tools/it-facts"` and an unused `i-heroicons-*` icon.
- [ ] 5.2 Add a third entry in `popover.links` of `app/components/base/Header.vue` matching the same fields.
- [ ] 5.3 Add `"/tools/it-facts": { swr: true }` to `routeRules` in `nuxt.config.ts`.

## 6. Optional illustration

- [ ] 6.1 Add `public/svg/it-facts/true-false.svg` (a minimal hand-rolled check/cross glyph) and reference it from the page `useSeo` favicon. Skip this task if shipping without an illustration; the page still renders without it.

## 7. End-to-end test

- [ ] 7.1 Add `itFacts: createConfig("/tools/it-facts")` to the `application` object in `tests/e2e/configuration.ts`.
- [ ] 7.2 Add `tests/e2e/pages/tools/it-facts/index.test.ts` with three Playwright tests: hero + Start button visible; clicking Start reveals a fact statement and True/False controls; after answering 10 questions the result screen shows the final score and "Play again" starts a new round.

## 8. Verification

- [ ] 8.1 Run `npm run lint` and ensure it passes (`nuxt typecheck && eslint .`).
- [ ] 8.2 Run `npm run dev:detached`, manually visit `/tools/it-facts`, complete a round, refresh the page, and confirm the best score persists.
- [ ] 8.3 Run `npm run test:e2e` locally (or scoped to the new test file) to confirm the Playwright suite passes against the running dev server.
