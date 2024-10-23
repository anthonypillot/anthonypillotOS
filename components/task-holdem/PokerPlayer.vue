<template>
  <div class="flex flex-col items-center p-4 border border-gray-400 rounded bg-gray-700 bg-opacity-50">
    <NuxtImg class="max-h-12 lg:max-h-16 z-10" :src="useAvatar(user.avatar)" :alt="'poker player ' + user.avatar" />
    <div class="absolute bg-indigo-400 h-10 w-10 blur-md"></div>
    <p class="text-xs text-white text-ellipsis overflow-hidden text-center max-w-16">{{ user.name }}</p>
    <div class="flex justify-center mt-2">
      <div
        :class="`flex items-center justify-center text-center h-10 w-8 lg:h-14 lg:w-10 border-2 border-indigo-100 rounded ${
          status === 'revealed' ? 'bg-gray-800' : 'poker-card-back'
        }`"
      >
        <span v-if="status === 'playing' || status === 'revealing'" class="text-white">{{ getRandomEmoji() }}</span>
        <span v-else-if="status === 'revealed' && typeof getSelectedCardValue() === 'number'" class="text-white text-xl">{{
          getSelectedCardValue()
        }}</span>
        <component v-else-if="status === 'revealed' && getSelectedCardValue()" :is="getSelectedCardValue()" class="text-white w-8" />
        <component v-else :is="QuestionMarkCircleIcon" class="text-white w-8" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from "@/components/task-holdem/CreateUser.vue";
import { valueToComponent, type GameStatus } from "@/types/task-holdem.type";
import { QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  user: User;
  status: GameStatus;
}>();

function getRandomEmoji(): string {
  const emojis = ["♠️", "♣️", "♥️", "♦️"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function getSelectedCardValue(): number | Component | null {
  if (props.user.selectedCard) {
    if (props.user.selectedCard.type === "icon") {
      return valueToComponent[props.user.selectedCard.value];
    } else if (props.user.selectedCard.type === "number" && typeof props.user.selectedCard.value === "number") {
      return props.user.selectedCard.value;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
</script>

<style scoped>
.poker-card-back {
  background-image: linear-gradient(45deg, rgb(129 140 248) 50%, white 50%);
}
</style>
