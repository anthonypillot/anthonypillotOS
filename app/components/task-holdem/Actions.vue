<template>
  <section class="flex flex-col gap-2 text-white md:items-end">
    <button
      class="flex gap-x-2 text-white text-sm border border-white rounded-md px-4 py-2 hover:bg-white hover:text-black max-w-fit"
      @click="copyInvitationToClipboard()"
    >
      <UserPlusIcon class="h-5 w-5" />
      {{ isInvitationButtonClicked ? "Invitation link copied!" : "Invite players" }}
    </button>
    <button
      class="flex gap-x-2 text-white text-sm border border-white rounded-md px-4 py-2 hover:bg-white hover:text-black max-w-fit"
      @click="isFeedbackOpen = true"
    >
      <PaperAirplaneIcon class="h-5 w-5" />
      Feedback (bug, suggestion, etc.)
    </button>
  </section>
  <Transition>
    <FormFeedback :isOpen="isFeedbackOpen" @close="isFeedbackOpen = false" />
  </Transition>
</template>

<script setup lang="ts">
import { PaperAirplaneIcon, UserPlusIcon } from "@heroicons/vue/20/solid";

//#region Invitation link
const isInvitationButtonClicked = ref<boolean>(false);

function copyInvitationToClipboard() {
  navigator.clipboard.writeText(window.location.href);
  isInvitationButtonClicked.value = true;
  setTimeout(() => {
    isInvitationButtonClicked.value = false;
  }, 3000);
}
//#endregion

//#region Feedback
const isFeedbackOpen = ref<boolean>(false);
//#endregion
</script>
