<template>
  <section class="flex flex-col gap-y-6 w-full">
    <div class="flex justify-between">
      <div v-for="user in topHalfUsers" class="flex flex-col flex-wrap">
        <TaskHoldemPokerPlayer :user :isRevealed="props.game.isRevealed" />
      </div>
    </div>
    <div class="flex flex-col gap-y-2 justify-center items-center h-56 w-full p-4 bg-indigo-950 sm:rounded-3xl border border-indigo-400">
      <div v-if="!props.game.isRevealed">
        <button
          :class="
            'text-white bg-indigo-900 border border-white rounded-md px-4 py-2 min-w-40' +
            (isAnyUserWithSelectedCard ? ' cursor-pointer hover:bg-white hover:text-black' : ' cursor-not-allowed bg-gray-800 opacity-50')
          "
          @click="reveal()"
          :disabled="!isAnyUserWithSelectedCard"
        >
          {{ isAnyUserWithSelectedCard ? (isRevealing ? countdown : "Reveal cards!") : "Waiting at least one user to select a card" }}
        </button>
      </div>
      <div v-else class="text-center">
        <p class="text-white text-lg">Result</p>
        <p class="text-white"><span class="text-gray-200">Average</span>: TODO</p>
        <p class="text-white"><span class="text-gray-200">Concensus</span>: TODO</p>
        <button
          class="text-white bg-indigo-900 border border-white rounded-md px-2 py-1 mt-4 hover:bg-white hover:text-black"
          @click="emit('restart')"
        >
          Restart
        </button>
      </div>
    </div>
    <div v-if="bottomHalfUsers" class="flex flex-wrap justify-between">
      <TaskHoldemPokerPlayer v-for="user in bottomHalfUsers" :user :isRevealed="props.game.isRevealed" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Room } from "@/types/task-holdem.type";

const props = defineProps<Room>();

const topHalfUsers = computed(() => props.users.slice(0, Math.ceil(props.users.length / 2)));
const bottomHalfUsers = computed(() => props.users.slice(Math.ceil(props.users.length / 2)));

const emit = defineEmits<{
  reveal: [];
  restart: [];
}>();

const countdownDuration = 2;
const countdown = ref<number>(countdownDuration);

const isRevealing = ref<boolean>(false);

function reveal(): void {
  isRevealing.value = true;

  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value === 0) {
      clearInterval(timer);
      countdown.value = countdownDuration;
      isRevealing.value = false;
      emit("reveal");
    }
  }, 1000);
}

const isAnyUserWithSelectedCard = computed(() => props.users.some((user) => user.selectedCard !== null));
const isEveryoneReady = computed(() => props.users.every((user) => user.selectedCard !== null));
</script>
