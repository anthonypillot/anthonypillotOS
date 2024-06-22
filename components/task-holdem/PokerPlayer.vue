<template>
  <div class="flex flex-col items-center">
    <NuxtImg class="max-h-12 lg:max-h-16 z-10" :src="useAvatar(user.avatar)" alt="poker player" />
    <div class="absolute bg-indigo-200 h-12 w-12 blur-lg"></div>
    <p class="text-xs text-white text-ellipsis overflow-hidden text-center max-w-16">{{ user.name }}</p>
    <div class="flex justify-center mt-1">
      <div
        :class="`poker-card ${
          isRevealed ? '' : 'poker-card-back'
        } flex items-center justify-center text-center h-10 w-8 lg:h-14 lg:w-10 border-2 border-indigo-100 rounded shadow-md shadow-indigo-200 `"
      >
        <span :class="`text-xl ${isRevealed ? 'text-white' : ''}`">{{
          isRevealed ? user.selectedCard?.value || "?" : getRandomEmoji()
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from "@/components/task-holdem/CreateUser.vue";

defineProps<{
  user: User;
  isRevealed: boolean;
}>();

function getRandomEmoji(): string {
  const emojis = ["♠️", "♣️", "♥️", "♦️"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}
</script>

<style scoped>
.poker-card-back {
  background-image: linear-gradient(45deg, rgb(129 140 248) 50%, white 50%);
}
</style>
