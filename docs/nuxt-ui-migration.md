# Nuxt UI Migration - Known Bugs

> Bugs discovered after migrating to Nuxt UI v4 components.

## Bug 1: Task Hold'em - Invite Players Button Not Working ✅ FIXED

**File**: `app/components/task-holdem/Actions.vue`

**Symptom**: Clicking the "Invite players" button does not copy the invitation link to clipboard.

**Root Cause**: The `copyInvitationToClipboard()` function called `navigator.clipboard.writeText()` without `await` and without error handling. If the clipboard API failed (browser permissions, non-HTTPS context), the error was silently swallowed and the button label never updated.

**Fix Applied**: Made the function `async`, added `await`, and added a fallback using `document.execCommand("copy")` for browsers that don't support the clipboard API.

```ts
async function copyInvitationToClipboard() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    isInvitationButtonClicked.value = true;
    setTimeout(() => {
      isInvitationButtonClicked.value = false;
    }, 3000);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = window.location.href;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    isInvitationButtonClicked.value = true;
    setTimeout(() => {
      isInvitationButtonClicked.value = false;
    }, 3000);
  }
}
```

**Status**: ✅ Fixed

---

## Bug 2: Task Hold'em - Feedback Button Not Working ✅ FIXED

**File**: `app/components/task-holdem/Actions.vue`

**Symptom**: Clicking the "Feedback (bug, suggestion, etc.)" button does not open the feedback modal.

**Root Cause**: The `<Transition>` wrapper in `Actions.vue` was incompatible with `FormFeedback`'s conditional root element (`v-if="isOpen"` on `<section>`). Vue's `<Transition>` requires a single root element to transition, so it failed when the component conditionally rendered nothing.

**Fix Applied**: Removed the `<Transition>` wrapper. The `FormFeedback` component handles its own visibility with `v-if` and has its own overlay/background styling.

```diff
  </section>
- <Transition>
  <FormFeedback :is-open="isFeedbackOpen" @close="isFeedbackOpen = false" />
- </Transition>
```

**Additional Fix**: The success icon in `FormFeedback.vue` had the wrong name (`i-heroicons-20-solid-check-circle` → `i-heroicons-check-circle-20-solid`). The variant suffix must come after the icon name.

**Status**: ✅ Fixed

---

## Bug 3: GitHub History Cleaner - Confirmation Modal Not Opening on Submit ✅ FIXED

**File**: `app/components/github/HistoryCleaner.vue`

**Symptom**: Clicking the "Submit" button on the GitHub History Cleaner form does not open the confirmation modal.

**Root Cause**: Two issues were found:

1. **Form state mismatch**: `form.options` was initialized as `[]` while the first checkbox was visually checked by default. Zod validation rejected the submit because `options: z.array(z.string()).min(1)` required at least one option. The `onSubmit` handler never ran.

2. **UModal `#content` slot incompatibility**: The `#content` slot is designed for modals with a trigger element in the default slot. Programmatic control via `v-model:open` works with `#body` + `#footer` slots instead.

**Fix Applied**:

1. Pre-filled `form.options` with `[HistoryCleanerOptions.WORKFLOW_RUNS]` to match the initial UI state:
```ts
const form = ref<Schema>({
  account: "",
  repository: "",
  token: "",
  options: [HistoryCleanerOptions.WORKFLOW_RUNS],
});
```

2. Switched from `#content` to `#body` + `#footer` slots and removed the hidden trigger button:
```vue
<UModal v-model:open="confirmationModal" :dismissible="!loading" title="Confirm deletion" :ui="{ footer: 'justify-end' }">
  <template #body>
    <!-- confirmation content -->
  </template>
  <template #footer>
    <UButton label="Confirm" color="error" :loading="loading" @click="confirm()" />
    <UButton label="Cancel" variant="outline" :disabled="loading" @click="confirmationModal = false" />
  </template>
</UModal>
```

**Status**: ✅ Fixed

---

## Common Patterns

All three bugs involve UI components that should open/show something in response to user interaction:

1. **Clipboard API** - `navigator.clipboard.writeText()` not working
2. **Conditional rendering** - `v-if` with `<Transition>` not showing component
3. **Programmatic modal** - `UModal` not opening via `v-model:open`

## Next Steps

All three bugs have been fixed. Run Playwright E2E tests to verify:
- `npm run test:e2e` — verify all E2E tests pass
- Manual testing: invite players button, feedback modal, GitHub History Cleaner form submission

## Key Learnings

- **UModal slots**: `#content` requires a trigger element in the default slot. For programmatic control via `v-model:open`, use `#body` + `#footer` slots instead.
- **Form state initialization**: When UI elements have default checked/selected states, the form state must be initialized to match. Otherwise validation will fail silently.
- **UModal footer alignment**: Use `:ui="{ footer: 'justify-end' }"` to right-align footer buttons.
- **Icon naming convention**: `i-heroicons-icon-name` for 24/outline, `i-heroicons-icon-name-solid` for 24/solid, `i-heroicons-icon-name-20-solid` for 20/solid. The variant suffix comes AFTER the icon name (e.g., `i-heroicons-check-circle-20-solid`, NOT `i-heroicons-20-solid-check-circle`).
