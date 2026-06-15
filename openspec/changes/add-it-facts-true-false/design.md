## Context

anthonypillotOS is a Nuxt 4 personal portfolio with two existing tools under `/tools`:

- **Task Hold'em** (`/tools/task-holdem`) — realtime planning poker using Socket.IO and Prisma. Full backend, rooms, users, multiple SFCs.
- **GitHub History Cleaner** (`/tools/github/history-cleaner`) — single-page form that calls a Nitro POST endpoint to talk to the GitHub API. Server-side Zod validation, one SFC, hero + app.

The new feature is a **solo, no-backend** mini-game. It must follow the same two-section "hero + application" layout used by the other tools so the `/tools` page reads consistently. It must reuse existing libraries (`@nuxt/ui`, Tailwind v4, Vue 3 `<script setup lang="ts">`) and conventions from `AGENTS.md` (2-space indent, double quotes, `export default` for composables/pages, Nuxt auto-imports, shared types in `shared/types/`).

Constraints from `AGENTS.md`:

- Indentation: 2 spaces, no tabs.
- Strict TS (`noUncheckedIndexedAccess`, `noUnusedLocals`, etc.).
- Auto-imported composables/components/types — no manual imports for them.
- Components in `app/components/<feature>/` with PascalCase filenames; directory name becomes the prefix (`it-facts/` → `<ItFacts...>`).
- Pages use `<script setup lang="ts">` and call `useSeo()`.
- No `<style>` blocks; Tailwind classes only.
- No new comments unless asked.
- Global `logger` is server-only — not used here (no server work).
- SWR routes listed in `nuxt.config.ts → routeRules`.
- Lint command: `npm run lint` (`nuxt typecheck && eslint .`).

The implementation is small enough to live in ~6 files plus a data module and one E2E test, and to ship with zero new infrastructure.

## Goals / Non-Goals

**Goals:**

- A polished, mobile-friendly solo True/False game at `/tools/it-facts`.
- A curated, typed, versioned set of ~20 IT facts shipped with the repo.
- Fixed round of 10 questions per play; immediate per-question feedback (correct/incorrect + short explanation).
- A final score screen with the current score, the all-time best score, and a Restart button.
- Best score persisted in `localStorage` under the key `it-facts:best` (per AGENTS spirit: cheap, transparent, no PII).
- Discoverable from `/tools` index and the BaseHeader popover.
- Covered by a Playwright E2E test that walks a full round.
- Passes `npm run lint`.

**Non-Goals:**

- Multiplayer, leaderboard, accounts, authentication.
- Server-side scoring, PostgreSQL storage, Prisma models, migrations.
- AI-generated or externally fetched facts (no third-party API, no token, no latency).
- Admin UI to add facts — facts are added via PR to `shared/data/it-facts.data.ts`.
- Analytics events beyond existing Matomo tracking.
- Internationalization (the existing site is English-only).
- Sound, animations beyond what `UButton`/`UBadge` already provide.
- Sharing results to social networks (no OAuth).

## Decisions

### D1. One Vue SFC per concern, mounted from one page

- `ItFactsHero.vue` — copy + "Start a round" CTA, identical gradient/clip-path treatment to `HistoryCleanerHero.vue`.
- `ItFactsGame.vue` — owns the round state machine (`idle | playing | feedback | finished`).
- `ItFactsResult.vue` — final score card with Restart.
- Page `app/pages/tools/it-facts/index.vue` mounts `<ItFactsHero />` + `<ItFactsGame />`. The game itself embeds `<ItFactsResult />` when status is `finished`.

Alternatives considered: a single mega-component — rejected, the existing two-section convention is clearer for SEO and reuse; a Pinia store — rejected, state is small and local to one page.

### D2. Facts as a typed data module, not a JSON file

- Location: `shared/data/it-facts.data.ts`.
- Shape: `ItFact = { id, statement, isTrue, explanation, source? }` (defined in `shared/types/it-facts.type.ts`).
- Exported as `itFacts: ItFact[] as const` so individual entries keep their literal `isTrue` types.
- ~20 hand-written facts covering acquisitions, language history, OS facts, GitHub lore, security myths, etc. Easy to extend in a PR.

Alternatives considered: load a JSON file at runtime — rejected, costs an extra fetch and gives up TS checking; fetch from a server endpoint — rejected per non-goals.

### D3. localStorage best score behind a composable

- `useItFactsScore()` returns `{ best: ComputedRef<number>, save: (score: number) => void }`.
- Reads from `localStorage` key `it-facts:best` (default `0`) on first call in a `ref` initialized lazily on the client.
- `save()` updates the ref and writes to `localStorage` only when the new score is strictly greater than the previous best.
- SSR-safe: guarded with `typeof window !== "undefined"` checks so initial server render produces `0`.

Alternatives considered: read/write `localStorage` directly inside `ItFactsResult.vue` — rejected, the composable is testable and keeps the component thin; use a Pinia store — rejected, no other feature uses Pinia.

### D4. Round mechanics

- Round length: 10 facts, fixed.
- On Start: copy `itFacts`, `shuffle` (Fisher–Yates using `Math.random()`), slice first 10, store in a local `facts` ref.
- On answer: compute `correct = (answer === currentFact.isTrue)`, increment `score` if correct, set `status = "feedback"`, disable both buttons.
- On Next (or auto-advance on last question): if `qIndex < 9`, increment `qIndex`, set `status = "playing"`; else set `status = "finished"`, call `useItFactsScore().save(score)`.
- Progress: `Question {qIndex + 1} of 10` text plus a `UProgress` bar at 0/10..10/10.

Alternatives considered: time-based mode (60s) — rejected, AGENTS recommends keeping additions simple; endless mode — rejected, fixed length gives a clear end screen and Restart CTA.

### D5. Page structure and SEO

- `useSeo({ title: "IT Facts", description: ..., favicon: { type: "image/svg", href: "/svg/it-facts/logo.svg" } })`.
- Route rule `"/tools/it-facts": { swr: true }` in `nuxt.config.ts` so the static hero benefits from SWR caching like the other tool pages.

### D6. Discoverability

- Add a third card to `app/pages/tools/index.vue`'s `tools` array: `{ name: "IT Facts", description: "Guess whether statements about the IT universe are true or false.", to: "/tools/it-facts", icon: "i-heroicons-check-badge" }`.
- Add a third entry in `popover.links` in `app/components/base/Header.vue` (matching fields).
- Icon chosen from the existing `i-heroicons-*` set per AGENTS note: `i-heroicons-check-badge` is unused elsewhere.

### D7. Testing

- **E2E (Playwright)**: one file `tests/e2e/pages/tools/it-facts/index.test.ts` with three `test()` cases:
  1. Hero + Start button visible.
  2. Clicking Start reveals a fact statement and True/False buttons.
  3. After answering 10 questions the result screen shows the final score and a "Play again" button that starts a new round.
- **Unit (Vitest)**: not added — the project scopes Vitest to `server/**` per AGENTS.md; `useItFactsScore` is straightforward localStorage glue and is covered transitively by the E2E test.
- **Linting**: `npm run lint` must pass.

### D8. Naming and imports

- Shared types live in `shared/types/it-facts.type.ts` and are auto-imported as globals in client + server (no explicit imports). This matches the convention for `task-holdem.type.ts` and `history-cleaner.type.ts`.
- One application constant `itFactsApplication = { id, name, description, path }` exported from the same types file, so header/popover/SEO can reuse it without duplicating strings.

## Risks / Trade-offs

- **localStorage is per-browser and can be cleared.** [Risk] → Documented behaviour: best score is a fun, best-effort metric, not a record. The E2E test does not assert best-score persistence.
- **Fact set is small and static.** [Risk] → Players will eventually memorize answers. Mitigation: keep the dataset easy to extend in a PR, and treat the curated list as a living document; new facts can be added without code changes elsewhere.
- **`Math.random()` shuffle is not cryptographically random.** [Risk] → Acceptable for a casual game; no fairness/security requirement. If desired later, a `crypto.getRandomValues()` swap is one line.
- **Strict TS `noUncheckedIndexedAccess`.** [Risk] → Indexing `facts[qIndex]` yields `ItFact | undefined`. Mitigation: guard with a non-null check before rendering, or destructure into a local.
- **SWR + `localStorage` interaction.** [Risk] → SWR caches the page payload; on the client, `localStorage` is read on mount, so SWR does not block reading/writing the best score. Mitigation: keep `useItFactsScore` reads in `onMounted`/computed-time only.
- **Accessibility of feedback.** [Risk] → Visual-only feedback (color) may not be conveyed to screen readers. Mitigation: use `UBadge` with text labels ("Correct" / "Incorrect") in addition to colors, and a visible score counter.
- **Hero illustration is optional.** [Risk] → If `public/svg/it-facts/logo.svg` is not added, the page still works but the hero uses the gradient background only. Mitigation: ship a minimal hand-rolled SVG (check/cross glyph) or a simple `NuxtImg` placeholder. Listed as a task; non-blocking.

## Open Questions

None for implementation. All meaningful product decisions were resolved with the user during planning (fact source = hardcoded; scoring = per-session + localStorage best; flow = fixed 10-question round; layout = hero + application). The only remaining discretion is the exact wording of the ~20 facts, which is content authored in `shared/data/it-facts.data.ts` and can be iterated in a follow-up PR.
