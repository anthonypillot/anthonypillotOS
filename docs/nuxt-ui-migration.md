# Nuxt UI Migration Plan

> Strategy for migrating raw HTML UI elements (`<input>`, `<button>`, `<textarea>`) to Nuxt UI v4 components.

## Current Status

- **Nuxt UI version**: `^4.8.2` (already installed in `package.json`)
- **Existing Nuxt UI usage**: `app/components/github/HistoryCleaner.vue` already uses `UForm`, `UFormField`, `UInput`, `UCheckbox`, `UButton`
- **Raw elements remaining**: 23 across 10 files (5 `<input>`, 1 `<textarea>`, 17 `<button>`)

## Component Mapping Reference

| Raw HTML Element | Nuxt UI Component | Notes |
|---|---|---|
| `<input type="text/email">` | `<UInput>` | Use `label` prop for labels, `error` prop for validation |
| `<textarea>` | `<UTextarea>` | Use `label` prop, auto-resize support |
| `<button>` | `<UButton>` | Use `variant`, `color`, `size`, `loading`, `icon` props |
| `<input type="radio">` | `<URadioGroup>` + `<URadio>` | Group with `label` prop |
| `<input type="checkbox">` | `<UCheckbox>` | Already used in HistoryCleaner |
| `<select>` | `<USelect>` / `<USelectMenu>` | None found in codebase |

## Files Requiring Migration

### 1. `app/components/form/Feedback.vue` — Priority: HIGH ✅ COMPLETED

**Elements**: 2 `<input>`, 1 `<textarea>`, 2 `<button>` (5 total)

**Current implementation**: Custom floating-label pattern using `@tailwindcss/forms` peer classes (`border-none bg-transparent placeholder-transparent focus:border-transparent focus:ring-0`).

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Name input | `<input type="text">` with custom CSS | `<UFormField name="name" label="Name" hint="Optional"><UInput v-model="state.name" type="text" /></UFormField>` |
| Email input | `<input type="email">` with custom CSS | `<UFormField name="email" label="Email" hint="Optional"><UInput v-model="state.email" type="email" /></UFormField>` |
| Message textarea | `<textarea>` with custom CSS | `<UFormField name="message" label="Feedback" required><UTextarea v-model="state.message" /></UFormField>` |
| Cancel button | `<button>` with Tailwind styles | `<UButton label="Cancel" variant="outline" @click="$emit('close')" />` |
| Submit button | `<button>` with conditional classes | `<UButton label="Submit" type="submit" :loading="isLoading" />` |

**Implementation details**:
- `UForm` with `:state="state"` and `:validate="validate"` for client-side validation
- `validate` function checks only `message` (name/email are optional — no validation)
- `UFormField` with `hint="Optional"` for name/email, `required` for message
- Server API updated: `z.nullable()` → `.optional()` so Zod output type (`string | undefined`) matches `UInput` v-model
- Submit button automatically disabled by `UForm` when validation fails (empty message)
- Floating-label effect replaced by `UFormField`'s built-in label rendering

**Key learnings**:
- `UInput`/`UTextarea` v-model expects `string | undefined`, not `string | null`
- Zod v4 `z.nullable()` outputs `string | null` — use `.optional()` for `string | undefined`
- `UForm` with `:validate` disables submit button when validation errors exist
- `UFormField` with `hint="Optional"` shows "Optional" text next to label

---

### 2. `app/components/task-holdem/CreateUser.vue` — Priority: HIGH

**Elements**: 2 `<input>`, 1 `<button>` (3 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Name text input | `<input type="text">` with inline classes | `<UInput v-model="userName" placeholder="Your name" @keydown.enter="create(userName)" />` |
| Avatar radio buttons | `<input type="radio">` | `<URadioGroup v-model="userAvatar" :items="avatars" variant="table" color="neutral" :ui="{ label: 'text-white' }" />` |
| Join game button | `<button>` with disabled state | `<UButton label="Join game" :disabled="!userName" @click="create(userName)" />` |

**Considerations**:
- The avatar selection uses custom radio buttons with image previews. `<URadioGroup>` with custom `class` slots on `<URadio>` can replicate the visual design.

---

### 3. `app/components/task-holdem/Chat.vue` — Priority: MEDIUM

**Elements**: 1 `<input>`, 3 `<button>` (4 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Message input | `<input type="text">` with inline classes | `<UInput v-model="message" placeholder="Your message" @keydown.enter="submit(user, message)" />` |
| Toggle chat open button | `<button>` with icon | `<UButton icon="heroicons:pencil-square" variant="outline" size="sm" @click="toggleChat()" />` |
| Toggle chat close button | `<button>` with icon | `<UButton icon="heroicons:x-mark" variant="ghost" size="sm" @click="toggleChat()" />` |
| Send button | `<button>` with disabled state | `<UButton label="Send" :disabled="message === ''" @click="submit(user, message)" />` |

**Considerations**:
- The chat uses a dark theme (`text-white`, `border-gray-700`). The `color` prop on `UButton` (e.g., `color="white"`) will handle the dark styling context.

---

### 4. `app/components/task-holdem/PokerTable.vue` — Priority: MEDIUM

**Elements**: 2 `<button>` (2 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Reveal cards button | `<button>` with conditional classes (disabled, hover, shadow) | `<UButton label="Reveal cards!" :disabled="!isAnyUserWithSelectedCard" :variant="isEveryoneReady ? 'solid' : 'outline'" />` |
| Restart button | `<button>` with hover effect | `<UButton label="Restart" @click="emit('restart')" />` |

**Considerations**:
- The reveal button has conditional styling based on `isEveryoneReady` (shadow effect). This can be handled via `UButton`'s `variant` prop. The dark theme (`bg-indigo-950`, `border-white`) maps to `color="white"`.

---

### 5. `app/components/task-holdem/Actions.vue` — Priority: MEDIUM

**Elements**: 2 `<button>` (2 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Invite players button | `<button>` with icon + text | `<UButton label="Invite players" icon="heroicons:user-plus" @click="copyInvitationToClipboard()" />` |
| Feedback button | `<button>` with icon + text | `<UButton label="Feedback (bug, suggestion, etc.)" icon="heroicons:paper-airplane" @click="isFeedbackOpen = true" />` |

**Considerations**:
- Both buttons use `flex gap-x-2` for icon-text spacing. `UButton` handles this with `trailing-icon` prop automatically.

---

### 6. `app/components/task-holdem/User.vue` — Priority: LOW

**Elements**: 1 `<button>` (1 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Remove user button | `<button>` with hover effect | `<UButton label="Remove" variant="outline" size="sm" @click="remove(user)" />` |

---

### 7. `app/components/github/HistoryCleaner.vue` — Priority: LOW

**Elements**: 2 `<button>` (2 total)

**Current state**: The main form already uses NuxtUI (`UForm`, `UFormField`, `UInput`, `UCheckbox`, `UButton`). Only the confirmation modal (built with `@headlessui/vue`) has raw buttons.

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Confirm button | `<button>` inside Headless UI `<Dialog>` | `<UButton label="Confirm" color="white" @click="confirm()" />` |
| Cancel button | `<button>` inside Headless UI `<Dialog>` | `<UButton label="Cancel" variant="outline" @click="confirmationModal = false" />` |

**Considerations**:
- These buttons live inside a `<Dialog>` from `@headlessui/vue`. They can be replaced with `UButton` without migrating the dialog itself. Alternatively, consider migrating to Nuxt UI's `<UDialog>` for consistency.

---

### 8. `app/components/github/HistoryCleanerHero.vue` — Priority: LOW

**Elements**: 1 `<button>` (1 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| CTA link button | `<button>` with arrow text | `<UButton label="Go to the GitHub History Cleaner tool" trailing-icon="heroicons:arrow-right" size="sm" variant="link" @click="scrollToTool()" />` |

---

### 9. `app/components/base/Header.vue` — Priority: LOW

**Elements**: 2 `<button>` (2 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Open mobile menu button | `<button>` with hamburger icon | `<UButton icon="heroicons:bars-3" variant="ghost" size="sm" @click="mobileMenuOpen = true" aria-label="Open main menu" />` |
| Close mobile menu button | `<button>` with X icon | `<UButton icon="heroicons:x-mark" variant="ghost" size="sm" @click="mobileMenuOpen = false" aria-label="Close menu" />` |

---

### 10. `app/components/base/ExperienceCard.vue` — Priority: LOW

**Elements**: 1 `<button>` (1 total)

**Migration plan**:

| Element | Current | Nuxt UI Replacement |
|---------|---------|---------------------|
| Close drawer button | `<button>` with X icon | `<UButton icon="heroicons:x-circle" variant="ghost" size="sm" @click="isDrawerOpen = false" />` |

---

## Migration Summary

| Priority | Files | Raw Elements | Nuxt UI Components Used |
|---|---|---|---|
| **HIGH** | `form/Feedback.vue` ✅, `task-holdem/CreateUser.vue` ✅ | 8 | `UInput`, `UTextarea`, `UButton`, `URadioGroup`, `URadio`, `UForm`, `UFormField` |
| **MEDIUM** | `task-holdem/Chat.vue`, `task-holdem/PokerTable.vue`, `task-holdem/Actions.vue` | 8 | `UInput`, `UButton` |
| **LOW** | `task-holdem/User.vue`, `github/HistoryCleaner.vue`, `github/HistoryCleanerHero.vue`, `base/Header.vue`, `base/ExperienceCard.vue` | 7 | `UButton` |

**Total**: 10 files, 23 raw elements to migrate. **2 completed** (8 elements migrated).

## Implementation Order

1. **HIGH priority** — Form components first (Feedback.vue, CreateUser.vue) since they involve form state management and validation
2. **MEDIUM priority** — Game UI components (Chat.vue, PokerTable.vue, Actions.vue)
3. **LOW priority** — Navigation and utility buttons (User.vue, HistoryCleaner.vue, HistoryCleanerHero.vue, Header.vue, ExperienceCard.vue)

## Notes

- The project already uses `@nuxt/ui` v4.8.2, so no dependency changes are required.
- Nuxt UI components support Tailwind CSS theming via CSS variables, so existing color schemes should carry over.
- The `floating` prop on `<UInput>` and `<UTextarea>` replicates the current floating-label pattern used in `Feedback.vue`.
- Icon integration uses Iconify via Nuxt Icon (200,000+ icons), matching the current Heroicons usage.
- Dark theme context (used in Task Hold'em components) is handled via `UButton`'s `color` prop (e.g., `color="white"` for light text on dark backgrounds).
