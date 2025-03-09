<template>
  <section class="flex flex-col gap-y-6 w-full">
    <div class="flex justify-between">
      <div v-for="user in topHalfUsers" class="flex flex-col flex-wrap">
        <TaskHoldemPokerPlayer :user :status="props.game.status" />
      </div>
    </div>
    <div
      class="flex flex-col gap-y-2 justify-center items-center h-56 w-full p-4 border-gray-400 rounded bg-gray-700 bg-opacity-10 sm:rounded-2xl border"
    >
      <div v-if="props.game.status === 'playing' || props.game.status === 'revealing'">
        <button
          :class="`text-white bg-indigo-950 border border-white rounded-sm px-4 py-2 min-w-40 ${
            isAnyUserWithSelectedCard ? 'cursor-pointer hover:bg-white hover:text-black' : 'cursor-not-allowed bg-indigo-800 opacity-50'
          } ${isEveryoneReady ? 'shadow-lg shadow-indigo-400' : ''}`"
          @click="reveal()"
          :disabled="!isAnyUserWithSelectedCard"
          data-testid="reveal-button"
        >
          {{
            isAnyUserWithSelectedCard
              ? game.status === "revealing"
                ? countdown
                : "Reveal cards!"
              : "Waiting at least one user to select a card"
          }}
        </button>
      </div>
      <div v-else-if="game.status === 'revealed'" class="flex flex-col gap-4 text-center">
        <div>
          <p class="text-white text-lg">Result</p>
          <p class="text-white"><span class="text-gray-200">Average</span>: {{ getAverage() }}</p>
        </div>
        <button
          class="text-white bg-indigo-950 border border-white rounded-sm px-4 py-2 cursor-pointer hover:bg-white hover:text-black"
          @click="emit('restart')"
          data-testid="restart-button"
        >
          Restart
        </button>
      </div>
    </div>
    <div v-if="bottomHalfUsers" class="flex flex-wrap justify-between">
      <TaskHoldemPokerPlayer v-for="user in bottomHalfUsers" :user :status="props.game.status" />
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-ignore
import confetti from "canvas-confetti";
import type { Room } from "@/types/task-holdem.type";

const props = defineProps<Room>();

const topHalfUsers = computed(() => props.users.slice(0, Math.ceil(props.users.length / 2)));
const bottomHalfUsers = computed(() => props.users.slice(Math.ceil(props.users.length / 2)));

const emit = defineEmits<{
  revealing: [];
  revealed: [];
  restart: [];
}>();

const countdownDuration = 2;
const countdown = ref<number>(countdownDuration);

function reveal(): void {
  props.game.status = "revealing";
  emit("revealing");
}

const scalar = 2;

watch(
  () => props.game.status,
  (status) => {
    if (status === "revealing") {
      const interval = setInterval(() => {
        countdown.value--;
        if (countdown.value === 0) {
          clearInterval(interval);
          countdown.value = countdownDuration;

          emit("revealed");
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            shapes: [
              confetti.shapeFromText({ text: "♣️", scalar }),
              confetti.shapeFromText({ text: "♠️", scalar }),
              confetti.shapeFromText({ text: "♦️", scalar }),
              confetti.shapeFromText({ text: "♥️", scalar }),
              confetti.shapeFromText({ text: "🤍", scalar }),
            ],
            scalar,
          });
        }
      }, 1000);
    }
  }
);

const isAnyUserWithSelectedCard = computed(() => props.users.some((user) => user.selectedCard !== null));
const isEveryoneReady = computed(() => props.users.every((user) => user.selectedCard !== null));

function getAverage(): number | string {
  const onlyNumberValues: number[] = props.users.map((user) => user.selectedCard?.value).filter((value) => typeof value === "number");

  if (onlyNumberValues.length > 0) {
    return onlyNumberValues.reduce((acc, value) => acc + value, 0) / onlyNumberValues.length;
  } else {
    return "N/A";
  }
}
</script>
