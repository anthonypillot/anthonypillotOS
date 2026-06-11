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
  <Transition>
    <FormFeedback :is-open="isFeedbackOpen" @close="isFeedbackOpen = false" />
  </Transition>
</template>

<script setup lang="ts">
const isInvitationButtonClicked = ref<boolean>(false);

function copyInvitationToClipboard() {
  navigator.clipboard.writeText(window.location.href);
  isInvitationButtonClicked.value = true;
  setTimeout(() => {
    isInvitationButtonClicked.value = false;
  }, 3000);
}

const isFeedbackOpen = ref<boolean>(false);
</script>
