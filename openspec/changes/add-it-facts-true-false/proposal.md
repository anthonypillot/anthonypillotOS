## Why

anthonypillotOS currently hosts two tools (Task Hold'em and GitHub History Cleaner) that are task-oriented but not playful. There is an opportunity to add a small, low-friction solo game under the existing `/tools` umbrella that fits the "intro to my IT world" theme of the site, demonstrates Nuxt 4 + Nuxt UI v4 + Tailwind patterns, and does not require any new infrastructure (no API route, no database, no realtime).

## What Changes

- Add a new public page at `/tools/it-facts` that hosts a single-player True/False mini-game about the IT universe.
- Add a curated, typed dataset of IT facts (statement, correct answer, short explanation) shipped with the codebase.
- Add a reusable composable for reading and writing the player's best score to `localStorage`.
- Add a "Tools" entry for the new game in `app/pages/tools/index.vue` and the BaseHeader popover.
- Register the new page in the SWR `routeRules` of `nuxt.config.ts`.
- Extend `tests/e2e/configuration.ts` with an `itFacts` application path and add a Playwright E2E test that walks through one full round.
- No new API routes, no Prisma model, no Socket.IO server, no authentication.

## Capabilities

### New Capabilities

- `it-facts-game`: A solo True/False mini-game about IT universe facts, played in fixed rounds of 10 questions, with immediate per-question feedback, a final score, a per-session score, and a best score persisted in `localStorage`.

### Modified Capabilities

- None. There are no existing specs in `openspec/specs/` to modify.

## Impact

- New files (frontend only):
  - `shared/data/it-facts.data.ts`
  - `shared/types/it-facts.type.ts`
  - `app/composables/useItFactsScore.ts`
  - `app/components/it-facts/ItFactsHero.vue`
  - `app/components/it-facts/ItFactsGame.vue`
  - `app/components/it-facts/ItFactsResult.vue`
  - `app/pages/tools/it-facts/index.vue`
  - `public/svg/it-facts/logo.svg` (illustration, optional)
  - `tests/e2e/pages/tools/it-facts/index.test.ts`
- Modified files:
  - `app/pages/tools/index.vue` (add a third tool card)
  - `app/components/base/Header.vue` (add a third popover link)
  - `nuxt.config.ts` (add `"/tools/it-facts": { swr: true }`)
  - `tests/e2e/configuration.ts` (add `itFacts` to `application`)
- Dependencies: none added. All new code uses libraries already in `package.json` (`@nuxt/ui`, Tailwind v4, Nuxt auto-imports).
- Backend / database: none. No migrations.
- Documentation: README does not list individual tools; no README change required.
- SEO: page sets its own `title`, `description`, and `favicon` via `useSeo()`.
- Accessibility: hero and game use semantic landmarks; True/False are real `<button>` elements via `UButton`; result state is announced via visible text.
- Lint / typecheck: the new code must pass `npm run lint` (`nuxt typecheck && eslint .`).
