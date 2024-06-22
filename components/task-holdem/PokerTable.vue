<template>
  <section class="flex flex-col gap-y-6 w-full">
    <div class="flex justify-between">
      <div v-for="user in topHalfUsers" class="flex flex-col flex-wrap">
        <TaskHoldemPokerPlayer :user :isRevealed />
      </div>
    </div>
    <div class="flex flex-col gap-y-2 justify-center items-center h-56 w-full p-4 bg-indigo-950 rounded-2xl border-4 border-indigo-400">
      <div v-if="!isRevealed">
        <button
          class="text-white bg-indigo-900 border border-white rounded-md px-4 py-2 hover:bg-white hover:text-black"
          @click="isRevealed = !isRevealed"
        >
          Reveal cards!
        </button>
      </div>
      <div v-else class="text-center">
        <p class="text-white text-lg">Result</p>
        <p class="text-white">Average: TODO</p>
        <p class="text-white">Concensus: TODO</p>
        <button
          class="text-white bg-indigo-900 border border-white rounded-md px-2 py-1 mt-4 hover:bg-white hover:text-black"
          @click="isRevealed = !isRevealed"
        >
          New turn
        </button>
      </div>
    </div>
    <div v-if="bottomHalfUsers" class="flex justify-between">
      <div v-for="user in bottomHalfUsers" class="flex flex-col flex-wrap">
        <TaskHoldemPokerPlayer :user :isRevealed />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { User } from "@/components/task-holdem/CreateUser.vue";

const props = defineProps<{
  users: User[];
}>();

const topHalfUsers = computed(() => props.users.slice(0, Math.ceil(props.users.length / 2)));
const bottomHalfUsers = computed(() => props.users.slice(Math.ceil(props.users.length / 2)));

const isRevealed = ref(false);
</script>
