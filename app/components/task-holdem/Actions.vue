<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton :label="copied ? 'Link copied!' : 'Invite players'" :icon="copied ? 'i-heroicons-check' : 'i-heroicons-user-plus'" :disabled="disabled" variant="soft" @click="copyInvitation" />
    <UButton aria-label="Send feedback" title="Send feedback" icon="i-heroicons-chat-bubble-bottom-center-text" color="neutral" variant="ghost" @click="isFeedbackOpen = true" />
    <span v-if="copyFailed" role="status" class="text-xs text-amber-300">Copy the room URL from your address bar.</span>
    <span class="sr-only" role="status">{{ copied ? 'Invitation link copied to clipboard' : '' }}</span>
  </div>
  <FormFeedback v-if="isFeedbackOpen" :is-open="isFeedbackOpen" @close="isFeedbackOpen = false" />
</template>

<script setup lang="ts">
const props = defineProps<{ disabled: boolean }>();
const copied = ref(false);
const copyFailed = ref(false);
const isFeedbackOpen = ref(false);
let timer: ReturnType<typeof setTimeout>;

async function copyInvitation(): Promise<void> {
  if (props.disabled) return;
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    copyFailed.value = false;
    clearTimeout(timer);
    timer = setTimeout(() => { copied.value = false; }, 3000);
  } catch {
    copyFailed.value = true;
  }
}

onScopeDispose(() => clearTimeout(timer));
</script>
