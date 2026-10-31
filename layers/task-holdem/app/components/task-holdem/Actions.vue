<template>
  <div class="flex min-w-0 max-w-full flex-wrap items-center gap-2">
    <div class="flex min-w-0 items-center gap-2">
      <UButton :label="copied ? 'Link copied!' : 'Invite players'" :icon="copied ? 'i-heroicons-check' : 'i-heroicons-user-plus'" :disabled="disabled" variant="soft" class="shrink-0" @click="copyInvitation" />
      <span v-if="copyFailed" role="status" class="min-w-0 max-w-52 text-xs text-warning">Copy the room URL from your address bar.</span>
    </div>
    <FormFeedback>
      <UButton aria-label="Send feedback" title="Send feedback" icon="i-heroicons-chat-bubble-bottom-center-text" color="neutral" variant="ghost" />
    </FormFeedback>
    <span class="sr-only" role="status">{{ copied ? 'Invitation link copied to clipboard' : '' }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled: boolean }>();
const emit = defineEmits<{ copied: [] }>();
const copied = ref(false);
const copyFailed = ref(false);
let timer: ReturnType<typeof setTimeout>;

async function copyInvitation(): Promise<void> {
  if (props.disabled) return;
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    emit("copied");
    copyFailed.value = false;
    clearTimeout(timer);
    timer = setTimeout(() => { copied.value = false; }, 3000);
  } catch {
    copyFailed.value = true;
  }
}

onScopeDispose(() => clearTimeout(timer));
</script>
