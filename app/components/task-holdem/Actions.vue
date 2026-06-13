<template>
  <section class="flex flex-col gap-2 text-white md:items-end">
    <UButton
      :label="isInvitationButtonClicked ? 'Invitation link copied!' : 'Invite players'"
      icon="i-heroicons-user-plus"
      variant="solid"
      class="text-white"
      @click="copyInvitationToClipboard()"
    />
    <UButton
      label="Feedback (bug, suggestion, etc.)"
      icon="i-heroicons-paper-airplane"
      variant="soft"
      class="text-white"
      @click="isFeedbackOpen = true"
    />
  </section>
  <FormFeedback :is-open="isFeedbackOpen" @close="isFeedbackOpen = false" />
</template>

<script setup lang="ts">
const isInvitationButtonClicked = ref<boolean>(false);

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

const isFeedbackOpen = ref<boolean>(false);
</script>
