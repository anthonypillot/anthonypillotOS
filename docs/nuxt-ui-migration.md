# Nuxt UI Migration - Known Bugs

> Bugs discovered after migrating to Nuxt UI v4 components.

## Bug 1: Task Hold'em - Invite Players Button Not Working

**File**: `app/components/task-holdem/Actions.vue`

**Symptom**: Clicking the "Invite players" button does not copy the invitation link to clipboard.

**Current Implementation**:
```vue
<UButton
  :label="isInvitationButtonClicked ? 'Invitation link copied!' : 'Invite players'"
  icon="i-heroicons-user-plus"
  variant="solid"
  class="text-white"
  @click="copyInvitationToClipboard()"
/>
```

```ts
function copyInvitationToClipboard() {
  navigator.clipboard.writeText(window.location.href);
  isInvitationButtonClicked.value = true;
  setTimeout(() => {
    isInvitationButtonClicked.value = false;
  }, 3000);
}
```

**Possible Causes**:
- `window.location.href` may not be accessible in the client-only context
- `navigator.clipboard` API may require HTTPS or localhost
- Button click event may not be firing due to z-index or overlay issues
- The button label updates but clipboard operation fails silently

**Status**: 🔴 Investigating

---

## Bug 2: Task Hold'em - Feedback Button Not Working

**File**: `app/components/task-holdem/Actions.vue`

**Symptom**: Clicking the "Feedback (bug, suggestion, etc.)" button does not open the feedback modal.

**Current Implementation**:
```vue
<UButton
  label="Feedback (bug, suggestion, etc.)"
  icon="i-heroicons-paper-airplane"
  variant="soft"
  class="text-white"
  @click="isFeedbackOpen = true"
/>
<Transition>
  <FormFeedback :is-open="isFeedbackOpen" @close="isFeedbackOpen = false" />
</Transition>
```

**FormFeedback component** (`app/components/form/Feedback.vue`):
```vue
<template>
  <section v-if="isOpen" class="fixed inset-0 z-20 flex items-center bg-gray-400/50 text-black">
    <!-- modal content -->
  </section>
</template>
```

**Possible Causes**:
- `<Transition>` wrapper may be interfering with `v-if` rendering
- `isFeedbackOpen` ref may not be updating correctly
- `FormFeedback` component may have z-index or positioning issues
- The `@close` event may be firing immediately, closing the modal before it opens
- The component may not be receiving the `isOpen` prop correctly

**Status**: 🔴 Investigating

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

1. Debug each issue in browser dev tools to identify root cause
2. Check if Nuxt UI v4 components have specific requirements for programmatic control
3. Consider alternative approaches:
   - For clipboard: Use `UButton` with `to` prop or custom click handler
   - For feedback: Replace `<Transition>` with `UModal` or `UDrawer`

## Key Learnings

- **UModal slots**: `#content` requires a trigger element in the default slot. For programmatic control via `v-model:open`, use `#body` + `#footer` slots instead.
- **Form state initialization**: When UI elements have default checked/selected states, the form state must be initialized to match. Otherwise validation will fail silently.
- **UModal footer alignment**: Use `:ui="{ footer: 'justify-end' }"` to right-align footer buttons.
