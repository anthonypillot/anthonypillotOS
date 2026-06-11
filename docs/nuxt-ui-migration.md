# Nuxt UI Migration Plan

> Strategy for migrating the UI layer to Nuxt UI v4 components and removing legacy dependencies (`@headlessui/vue`, `@heroicons/vue`).

## Current Status

- **Nuxt UI version**: `^4.8.2` (already installed in `package.json`)
- **Phase 1** (raw HTML elements → Nuxt UI components): ✅ **COMPLETED** — 23 elements across 10 files
- **Phase 2** (remove `@headlessui/vue` and `@heroicons/vue`): ✅ **COMPLETED** — 7 files migrated, dependencies removed
- **Phase 3** (dependency cleanup): ✅ **COMPLETED** — `@headlessui/vue`, `@heroicons/vue`, `@tailwindcss/forms` removed

### Removed Dependencies

| Package | Status |
|---|---|
| `@headlessui/vue` | ✅ Removed |
| `@heroicons/vue` | ✅ Removed |
| `@tailwindcss/forms` | ✅ Removed |

### Added Dependencies

| Package | Purpose |
|---|---|
| `@iconify-json/heroicons` | Local icon data for heroicons (required by `@nuxt/icon`) |

---

## Phase 1: Raw HTML Elements → Nuxt UI Components ✅ COMPLETED

All 23 raw HTML elements (`<input>`, `<button>`, `<textarea>`) across 10 files have been migrated to Nuxt UI components.

| Priority | Files | Elements | Nuxt UI Components |
|---|---|---|---|
| **HIGH** | `form/Feedback.vue` ✅, `task-holdem/CreateUser.vue` ✅ | 8 | `UInput`, `UTextarea`, `UButton`, `URadioGroup`, `UForm`, `UFormField` |
| **MEDIUM** | `task-holdem/Actions.vue` ✅, `task-holdem/Chat.vue` ✅, `task-holdem/PokerTable.vue` ✅ | 8 | `UInput`, `UButton` |
| **LOW** | `task-holdem/User.vue` ✅, `github/HistoryCleaner.vue` ✅, `github/HistoryCleanerHero.vue` ✅, `base/Header.vue` ✅, `base/ExperienceCard.vue` ✅ | 7 | `UButton` |

### Key Learnings (Phase 1)

- `UInput`/`UTextarea` v-model expects `string | undefined`, not `string | null` — use Zod `.optional()` instead of `.nullable()`
- `color="white"` is invalid for `UButton`; use `variant="outline"` + `class="text-white"` for dark theme
- `size="xs"` available on `UButton` (replaces `text-xs`)
- `autofocus` works as a prop on `UInput`
- Custom shadows (e.g., `shadow-indigo-800 shadow-md`) can be preserved as classes on `UButton`
- Manual `@heroicons/vue` imports are unnecessary — Nuxt Icon resolves `i-heroicons-*` strings automatically

---

## Phase 2: Remove `@headlessui/vue` and `@heroicons/vue`

### Component Mapping Reference

| Old Pattern | Nuxt UI Replacement | Notes |
|---|---|---|
| Headless UI `<Dialog>` + `<DialogPanel>` (slide-in) | `<UDrawer direction="right" v-model:open="...">` | Use `#content` slot for drawer body |
| Headless UI `<Dialog>` + `<TransitionRoot>` (modal) | `<UModal v-model:open="..." title="...">` | Use `#body` and `#footer` slots |
| Headless UI `<Popover>` + `<PopoverButton>` + `<PopoverPanel>` | `<UPopover>` | Default slot = trigger, `#content` slot = panel |
| `<component :is="ImportedHeroicon" />` | `<UIcon name="i-heroicons-icon-name" />` | Use string-based icon names |
| `import { XIcon } from "@heroicons/vue/24/outline"` | `<UIcon name="i-heroicons-x" />` | No import needed |
| `import { XIcon } from "@heroicons/vue/20/solid"` | `<UIcon name="i-heroicons-20-solid-check-circle" />` | Suffix `-20-solid` for 20px solid variant |

---

### 1. `app/components/base/Header.vue` — Priority: HIGH

**Old imports**: `Dialog`, `DialogPanel`, `Popover`, `PopoverButton`, `PopoverPanel` from `@headlessui/vue`

#### 1a. Mobile menu: `<Dialog>` → `<UDrawer>`

The current mobile menu uses Headless UI `<Dialog>` with a `<DialogPanel>` that slides in from the right. This maps directly to `<UDrawer direction="right">`.

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| Mobile menu overlay + panel | `<Dialog>` + `<DialogPanel>` with `v-if` and manual backdrop | `<UDrawer v-model:open="mobileMenuOpen" direction="right" :handle="false" :ui="{ content: 'w-full sm:max-w-lg' }">` |
| Drawer content | Manual `<div>` with padding, logo, close button, links | `#content` slot with same inner HTML |

**Implementation details**:
- `v-model:open="mobileMenuOpen"` replaces `:open="mobileMenuOpen" @close="mobileMenuOpen = false"`
- `direction="right"` matches the current slide-in-from-right behavior
- `:handle="false"` hides the drag handle (not needed for a navigation drawer)
- Remove `<ClientOnly>` wrapper — `UDrawer` handles SSR correctly
- Remove the manual `<div class="fixed inset-0 z-50" />` backdrop — `UDrawer` renders its own overlay
- The close button already uses `<UButton>` — no change needed
- Navigation links remain as `<a>` tags with Tailwind classes
- The `<Popover>` inside the mobile menu also needs migration (see 1c)

#### 1b. Desktop tools popover: `<Popover>` → `<UPopover>`

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| Popover wrapper | `<Popover class="relative">` | `<UPopover :content="{ align: 'center', side: 'bottom', sideOffset: 8 }">` |
| Trigger button | `<PopoverButton>` with custom classes | Default slot: `<button>` with same classes (or `<UButton variant="ghost">`) |
| Panel content | `<PopoverPanel v-slot="{ close }">` with transition | `#content="{ close }"` slot, no manual `<transition>` needed |
| Icon rendering | `<component :is="item.icon">` | `<UIcon :name="item.icon" />` |

**Implementation details**:
- The trigger button keeps its custom styling (`text-sm font-semibold leading-6 text-white`) — use a plain `<button>` in the default slot
- Remove the manual `<transition>` wrapper — `UPopover` has built-in animations
- `v-slot="{ close }"` on `<PopoverPanel>` → `#content="{ close }"` slot on `<UPopover>`
- `<component :is="item.icon">` → `<UIcon :name="item.icon" />` (icon data is already string-based: `"i-heroicons-squares-plus"`)
- The `close()` function from the slot is called on `<NuxtLink @click="close()">` — same pattern works

#### 1c. Mobile tools popover: `<Popover>` → `<UPopover>` (inside mobile drawer)

Same migration as 1b, applied to the Popover nested inside the mobile menu drawer.

**Implementation details**:
- Same trigger/content slot mapping as 1b
- The `close()` function from UPopover's `#content` slot closes the popover; `mobileMenuOpen = false` closes the drawer — both are called on link click
- `<component :is="item.icon">` → `<UIcon :name="item.icon" />`

#### 1d. Script changes

```diff
- import { Dialog, DialogPanel, Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
```

No new imports needed — `UDrawer`, `UPopover`, `UButton`, `UIcon` are auto-imported.

---

### 2. `app/components/github/HistoryCleaner.vue` — Priority: HIGH

**Old imports**: `Dialog`, `DialogPanel`, `DialogTitle`, `TransitionChild`, `TransitionRoot` from `@headlessui/vue`

**What needs to change**: Confirmation modal built with Headless UI `<Dialog>` + manual transitions → `<UModal>`

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| Modal wrapper | `<TransitionRoot>` + `<Dialog>` + `<TransitionChild>` (backdrop + panel) | `<UModal v-model:open="confirmationModal" title="Confirm deletion">` |
| Modal title | `<DialogTitle as="h3">` | `title` prop on `<UModal>` |
| Modal body | Manual layout with icon, text, option list | `#body` slot with same inner HTML |
| Modal footer | Confirm + Cancel buttons | `#footer` slot with existing `<UButton>` elements |

**Implementation details**:
- `v-model:open="confirmationModal"` replaces `:show="confirmationModal"` + `@close="confirmationModal = false"`
- Remove `<TransitionRoot>`, `<TransitionChild>`, `<DialogPanel>`, `<DialogTitle>` — `UModal` handles all of this
- The red circle icon (`<UIcon name="i-heroicons-exclamation-triangle">`) and option list remain as-is in the `#body` slot
- The existing `<UButton>` elements move into the `#footer` slot
- `UModal` has built-in overlay, transitions, and dismiss-on-outside-click behavior
- The `:dismissible="!loading"` prop can prevent closing while the request is in flight

**Script changes**:
```diff
- import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
```

---

### 3. `app/components/form/Feedback.vue` — Priority: MEDIUM

**Old import**: `CheckCircleIcon` from `@heroicons/vue/20/solid`

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| Success icon | `<CheckCircleIcon class="h-10 w-10" />` | `<UIcon name="i-heroicons-20-solid-check-circle" class="h-10 w-10" />` |

**Implementation details**:
- The `20/solid` variant maps to the `-20-solid` suffix in UIcon naming: `i-heroicons-20-solid-check-circle`
- Remove the import statement

**Script changes**:
```diff
- import { CheckCircleIcon } from "@heroicons/vue/20/solid";
```

---

### 4. `shared/types/task-holdem.type.ts` — Priority: MEDIUM

**Old import**: `BellSnoozeIcon`, `QuestionMarkCircleIcon` from `@heroicons/vue/24/outline`

**What needs to change**: The `valueToComponent` record maps card values to Vue components. This needs to become a string-based icon name map.

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| `valueToComponent` record | `Record<string, Component>` with imported icon components | `Record<string, string>` with UIcon string names |

**Implementation details**:
- Rename `valueToComponent` → `valueToIconName`
- Change type from `Record<string, Component>` to `Record<string, string>`
- `BellSnoozeIcon` → `"i-heroicons-bell-snooze"`
- `QuestionMarkCircleIcon` → `"i-heroicons-question-mark-circle"`
- Consumers (`PokerPlayer.vue`) update their import and template accordingly

**Changes**:
```diff
- import { BellSnoozeIcon, QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";
-
- export const valueToComponent: Record<string, Component> = {
-   skip: BellSnoozeIcon,
-   break: QuestionMarkCircleIcon,
- };
+ export const valueToIconName: Record<string, string> = {
+   skip: "i-heroicons-bell-snooze",
+   break: "i-heroicons-question-mark-circle",
+ };
```

---

### 5. `app/components/task-holdem/PokerPlayer.vue` — Priority: MEDIUM

**Old import**: `QuestionMarkCircleIcon` from `@heroicons/vue/24/outline`

**What needs to change**: The fallback icon and the dynamic component rendering need to switch from imported components to `<UIcon>`.

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| Fallback card icon | `<component :is="QuestionMarkCircleIcon" class="text-white w-8" />` | `<UIcon name="i-heroicons-question-mark-circle" class="text-white w-8" />` |
| Dynamic icon from `valueToComponent` | `<component :is="getSelectedCardValue()" />` | `<UIcon :name="getSelectedCardValue()" />` (returns string instead of Component) |

**Implementation details**:
- `getSelectedCardValue()` return type changes from `number | Component | null` to `number | string | null`
- The `valueToComponent` import from `shared/types/task-holdem.type.ts` changes to `valueToIconName` (see file 4 above)
- Template condition `v-else-if="status === 'revealed' && getSelectedCardValue()"` now renders `<UIcon :name="getSelectedCardValue()" />` instead of `<component :is>`
- The fallback `<component :is="QuestionMarkCircleIcon">` becomes `<UIcon name="i-heroicons-question-mark-circle" />`

**Script changes**:
```diff
- import { QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";
- // import valueToComponent → valueToIconName from shared types
```

---

### 6. `app/pages/tools/index.vue` — Priority: LOW

**Old import**: `SquaresPlusIcon`, `ArrowPathRoundedSquareIcon` from `@heroicons/vue/24/outline`

| Element | Current | Nuxt UI Replacement |
|---|---|---|
| Tool icon rendering | `<component :is="tool.icon">` with imported component | `<UIcon :name="tool.icon" />` with string name |
| Tool data `icon` field | `icon: SquaresPlusIcon` (component reference) | `icon: "i-heroicons-squares-plus"` (string) |

**Script changes**:
```diff
- import { SquaresPlusIcon, ArrowPathRoundedSquareIcon } from "@heroicons/vue/24/outline";
-
  const tools = [
    {
      name: taskHoldemApplication.name,
      description: "...",
      to: "/tools/task-holdem",
-     icon: SquaresPlusIcon,
+     icon: "i-heroicons-squares-plus",
    },
    {
      name: "GitHub History Cleaner",
      description: "...",
      to: "/tools/github/history-cleaner",
-     icon: ArrowPathRoundedSquareIcon,
+     icon: "i-heroicons-arrow-path-rounded-square",
    },
  ];
```

**Template changes**:
```diff
- <component :is="tool.icon" class="h-6 w-6 flex-none text-indigo-400" aria-hidden="true" />
+ <UIcon :name="tool.icon" class="h-6 w-6 flex-none text-indigo-400" aria-hidden="true" />
```

---

## Phase 3: Dependency Cleanup

After all Phase 2 migrations are complete:

### 3a. Remove `@headlessui/vue`

```bash
npm uninstall @headlessui/vue
```

### 3b. Remove `@heroicons/vue`

```bash
npm uninstall @heroicons/vue
```

### 3c. Remove `@tailwindcss/forms` (optional)

No usage of `@tailwindcss/forms` patterns (`form-input`, `form-select`, `form-checkbox`, `form-radio`) was found in the codebase. Nuxt UI provides its own form styling. Safe to remove:

```bash
npm uninstall -D @tailwindcss/forms
```

> **Note**: Verify the Tailwind config does not reference `@tailwindcss/forms` as a plugin before removing.

---

## Migration Summary

### Phase 1: Raw HTML Elements ✅ COMPLETED

| # | File | Elements | Status |
|---|---|---|---|
| 1 | `app/components/form/Feedback.vue` | 5 | ✅ |
| 2 | `app/components/task-holdem/CreateUser.vue` | 3 | ✅ |
| 3 | `app/components/task-holdem/Chat.vue` | 4 | ✅ |
| 4 | `app/components/task-holdem/PokerTable.vue` | 2 | ✅ |
| 5 | `app/components/task-holdem/Actions.vue` | 2 | ✅ |
| 6 | `app/components/task-holdem/User.vue` | 1 | ✅ |
| 7 | `app/components/github/HistoryCleaner.vue` | 2 | ✅ |
| 8 | `app/components/github/HistoryCleanerHero.vue` | 1 | ✅ |
| 9 | `app/components/base/Header.vue` | 2 | ✅ |
| 10 | `app/components/base/ExperienceCard.vue` | 1 | ✅ |

### Phase 2: Remove Old Dependencies ✅ COMPLETED

| # | File | Old Library | What to Migrate | Status |
|---|---|---|---|---|
| 1 | `app/components/base/Header.vue` | `@headlessui/vue` | `Dialog` → `UDrawer`, `Popover` → `UPopover` | ✅ |
| 2 | `app/components/github/HistoryCleaner.vue` | `@headlessui/vue` | `Dialog` + transitions → `UModal` | ✅ |
| 3 | `app/components/form/Feedback.vue` | `@heroicons/vue` | `CheckCircleIcon` → `UIcon` | ✅ |
| 4 | `shared/types/task-holdem.type.ts` | `@heroicons/vue` | `valueToComponent` → `valueToIconName` (string map) | ✅ |
| 5 | `app/components/task-holdem/PokerPlayer.vue` | `@heroicons/vue` | `QuestionMarkCircleIcon` → `UIcon` | ✅ |
| 6 | `app/components/task-holdem/Card.vue` | `@heroicons/vue` | `valueToComponent` → `valueToIconName` + `UIcon` | ✅ |
| 7 | `app/pages/tools/index.vue` | `@heroicons/vue` | Component refs → string icon names | ✅ |

### Phase 3: Dependency Cleanup ✅ COMPLETED

| # | Action | Status |
|---|---|---|
| 1 | `npm uninstall @headlessui/vue` | ✅ |
| 2 | `npm uninstall @heroicons/vue` | ✅ |
| 3 | `npm uninstall -D @tailwindcss/forms` + remove from `tailwind.config.ts` | ✅ |

---

## Implementation Order

1. **`shared/types/task-holdem.type.ts`** — Rename `valueToComponent` → `valueToIconName` (shared dependency, must go first)
2. **`app/components/task-holdem/PokerPlayer.vue`** — Update to use `valueToIconName` + `UIcon` (depends on step 1)
3. **`app/components/form/Feedback.vue`** — Simple icon swap (`CheckCircleIcon` → `UIcon`)
4. **`app/pages/tools/index.vue`** — Simple icon data + template swap
5. **`app/components/github/HistoryCleaner.vue`** — Confirmation modal (`Dialog` → `UModal`)
6. **`app/components/base/Header.vue`** — Most complex: mobile drawer + two popovers
7. **Dependency cleanup** — Remove `@headlessui/vue`, `@heroicons/vue`, optionally `@tailwindcss/forms`

## Verification

After each file migration:
1. `npm run lint` — Ensure no type errors
2. `npm run test` — Ensure unit tests pass
3. Visual check in browser (dev server) for the affected page/component

After full Phase 2 + 3 completion:
1. `npm run lint` — No references to removed packages
2. `npm run test` — All unit tests pass
3. `npm run build` — Production build succeeds
4. Grep for `@headlessui/vue` and `@heroicons/vue` — zero results

## Notes

- **UIcon naming convention**: `i-heroicons-icon-name` for 24/outline (default), `i-heroicons-solid-icon-name` for 24/solid, `i-heroicons-20-solid-icon-name` for 20/solid
- **`UPopover` transitions**: Built-in — no need for manual `<transition>` wrappers
- **`UModal` transitions**: Built-in — no need for `<TransitionRoot>` / `<TransitionChild>`
- **`UDrawer` transitions**: Built-in via Vaul — smooth slide animation
- **`<component :is>` pattern**: When icon data changes from component references to strings, all `<component :is="...">` usages must become `<UIcon :name="..." />`
- **`UModal` slots**: `#content` (full custom), or `#header` + `#body` + `#footer` for structured layout
- **`UPopover` slots**: Default slot = trigger, `#content` = panel. The `close` function is available in `#content` slot when `mode="click"` (default)
- **`UDrawer` slots**: Default slot = trigger, `#content` = drawer body. Use `v-model:open` to control programmatically when trigger is external
- **Dark theme**: `color="white"` is NOT valid for `UButton` (valid: `"error" | "primary" | "secondary" | "success" | "info" | "warning" | "neutral"`). Use `variant="outline"` + `class="text-white"` for buttons with borders and white text.
- **Sizes**: `size="xs"` available on `UButton` (replaces `text-xs` on raw buttons).
- **Autofocus**: `autofocus` works as a prop on `UInput` (maps to HTML `autofocus` attribute).
- **Shadows**: Custom shadows (e.g., `shadow-indigo-800 shadow-md`) can be preserved as classes on `UButton`.
- **Icons**: Manual `@heroicons/vue` imports are unnecessary — Nuxt Icon resolves `i-heroicons-*` strings automatically. Use `<UIcon name="i-heroicons-*" />` in templates or `icon: "i-heroicons-*"` in data.

### Key Learnings (Phase 2)

- **`UModal` with `#content` slot**: Use for full custom layouts (e.g., confirmation modals with custom icon + text arrangement). The `title` prop can be omitted when the title is part of the custom body layout.
- **`UModal` `:dismissible` prop**: Set to `:dismissible="!loading"` to prevent closing the modal while an async operation is in flight.
- **`UDrawer` for mobile menus**: Use `direction="right"` and `:handle="false"` for navigation drawers. The `:ui="{ content: '...' }"` prop allows custom styling of the drawer content.
- **`UDrawer` removes need for `<ClientOnly>`**: Unlike Headless UI's `Dialog`, `UDrawer` handles SSR correctly.
- **`UPopover` replaces manual transitions**: The `<transition>` wrapper used with Headless UI's `PopoverPanel` is unnecessary — `UPopover` has built-in animations.
- **`UPopover` `#content` slot**: Receives `{ close }` function for closing the popover on link click.
- **`<component :is>` → `<UIcon>`**: When migrating from imported Heroicon components to string-based icon names, all `<component :is="iconRef">` usages must become `<UIcon :name="iconName">`.
- **`valueToComponent` → `valueToIconName` pattern**: When storing icon references in data objects, use string names (`"i-heroicons-icon-name"`) instead of component imports. This eliminates the need for `@heroicons/vue` imports in shared type files.
- **`@tailwindcss/forms` removal**: After migrating to Nuxt UI form components, `@tailwindcss/forms` is no longer needed. Remember to also remove it from `tailwind.config.ts` plugins array.
