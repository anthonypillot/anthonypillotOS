<template>
  <div class="text-white text-lg">
    <button
      class="flex gap-x-2 text-white text-sm border border-white rounded-md px-4 py-2 hover:bg-white hover:text-black"
      @click="copyInvitationToClipboard()"
    >
      <UserPlusIcon class="h-5 w-5" />
      {{ isInvitationButtonClicked ? "Invitation link copied!" : "Invite players" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { UserPlusIcon } from "@heroicons/vue/20/solid";

const isInvitationButtonClicked = ref(false);

function copyInvitationToClipboard() {
  navigator.clipboard.writeText(window.location.href);
  isInvitationButtonClicked.value = true;
  setTimeout(() => {
    isInvitationButtonClicked.value = false;
  }, 3000);
}
</script>
