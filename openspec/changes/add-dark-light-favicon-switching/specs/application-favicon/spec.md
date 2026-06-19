## ADDED Requirements

### Requirement: Application MAY declare a dark-mode favicon

The `Application` type defined in `shared/types/application.type.ts` MUST expose a `faviconDark?: string` field in addition to the existing `favicon: string` field. The field MUST be optional. When set, its value MUST be a relative path to an asset served from the `public/` directory (e.g. `/svg/it-facts/logo.svg`). When unset, only the existing single-favicon behavior applies.

The semantic meaning of each field MUST be:
- `favicon` — the icon shown when the browser reports `prefers-color-scheme: light`.
- `faviconDark` — the icon shown when the browser reports `prefers-color-scheme: dark`.

#### Scenario: Application with a single neutral favicon

- **WHEN** an `Application` constant sets `favicon` and leaves `faviconDark` unset
- **THEN** the page emits exactly one `<link rel="icon">` tag with the `favicon` URL and no `media` attribute

#### Scenario: Application with both light and dark favicons

- **WHEN** an `Application` constant sets both `favicon` and `faviconDark`
- **THEN** the page emits two `<link rel="icon">` tags, one with `media="(prefers-color-scheme: light)"` pointing to `favicon`, and one with `media="(prefers-color-scheme: dark)"` pointing to `faviconDark`

#### Scenario: TypeScript compatibility

- **WHEN** existing `Application` constants (e.g. `itFactsApplication`, `taskHoldemApplication`) are updated to add a `faviconDark` field
- **THEN** the type checker MUST accept the new field without modifying any other property

### Requirement: useApplicationSeo emits per-scheme favicon links

The `useApplicationSeo` composable in `app/composables/useApplicationSeo.ts` MUST, when called with an `Application` whose `faviconDark` is set, register two `<link rel="icon">` entries in the document head: one tagged `media="(prefers-color-scheme: light)"` and one tagged `media="(prefers-color-scheme: dark)"`. When `faviconDark` is unset, the composable MUST continue to emit exactly one `<link rel="icon">` (no `media` attribute) — preserving current behavior.

The two emitted entries MUST have distinct `key` attributes (e.g. `favicon-light`, `favicon-dark`) so that Vue/Unhead does not deduplicate them. The light-mode entry MUST be emitted first so that browsers without `media`-on-`<link>` support fall back to the light icon.

#### Scenario: useApplicationSeo with faviconDark set

- **WHEN** `useApplicationSeo(itFactsApplication)` is called and `itFactsApplication.faviconDark` is defined
- **THEN** the document head contains two `<link rel="icon">` elements: one with `media="(prefers-color-scheme: light)"` and `href` equal to `itFactsApplication.favicon`, and one with `media="(prefers-color-scheme: dark)"` and `href` equal to `itFactsApplication.faviconDark`

#### Scenario: useApplicationSeo with faviconDark unset

- **WHEN** `useApplicationSeo(app)` is called and `app.faviconDark` is undefined
- **THEN** the document head contains exactly one `<link rel="icon">` element with `href` equal to `app.favicon` and no `media` attribute

#### Scenario: Both light and dark pages of an application benefit

- **WHEN** a user navigates to either the landing page (`/tools/<id>`) or the application page (`/tools/<id>/application`) of an application whose `faviconDark` is set
- **THEN** both pages emit the same two per-scheme `<link rel="icon">` tags

### Requirement: White-silhouette favicons MUST be paired with a dark-fill variant

Any `Application` constant whose `favicon` asset is a white silhouette designed for dark browser chrome MUST set `faviconDark` to that existing white asset and MUST set `favicon` to a new dark-fill variant of the same artwork.

#### Scenario: IT Facts application

- **WHEN** the IT Facts application is rendered
- **THEN** `itFactsApplication.favicon` points to a dark-fill SVG (e.g. `/svg/it-facts/logo-light.svg`) and `itFactsApplication.faviconDark` points to the existing white SVG (`/svg/it-facts/logo.svg`)

#### Scenario: Task Hold'em application

- **WHEN** the Task Hold'em application is rendered
- **THEN** `taskHoldemApplication.favicon` points to a dark-fill SVG (e.g. `/svg/task-holdem/poker-hand-light.svg`) and `taskHoldemApplication.faviconDark` points to the existing white SVG (`/svg/task-holdem/poker-hand.svg`)

### Requirement: Dark-fill favicon assets exist in public/

A dark-fill SVG variant of each existing white favicon MUST be present in `public/svg/`:
- `public/svg/it-facts/logo-light.svg` — same `viewBox` and `<path>` data as `public/svg/it-facts/logo.svg`, with `fill` set to a dark color (e.g. `#0f172a`).
- `public/svg/task-holdem/poker-hand-light.svg` — same `viewBox` and `<path>` data as `public/svg/task-holdem/poker-hand.svg`, with `fill` set to a dark color (e.g. `#0f172a`).

#### Scenario: IT Facts light-mode asset is served

- **WHEN** a browser in light mode requests the favicon for `/tools/it-facts/*`
- **THEN** it receives `public/svg/it-facts/logo-light.svg` and the glyph is visible against the light tab background

#### Scenario: Task Hold'em light-mode asset is served

- **WHEN** a browser in light mode requests the favicon for `/tools/task-holdem/*`
- **THEN** it receives `public/svg/task-holdem/poker-hand-light.svg` and the glyph is visible against the light tab background
