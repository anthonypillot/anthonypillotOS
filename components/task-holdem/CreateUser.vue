<template>
  <section>
    <div class="flex flex-col gap-y-4 items-start">
      <p class="text-white">To join the game, please enter your informations:</p>
      <input
        class="text-black rounded"
        type="text"
        autofocus
        v-model="userName"
        placeholder="Your name"
        @keydown.enter="create(userName)"
      />
      <div class="flex flex-col items-start">
        <p class="text-white">Select your avatar:</p>
        <div class="flex gap-x-4">
          <label v-for="avatar in avatars" class="text-white cursor-pointer">
            <input class="cursor-pointer" type="radio" :value="avatar.value" v-model="userAvatar" />
            {{ avatar.label }}
          </label>
        </div>
      </div>
      <button
        :class="`text-white border border-white rounded-md px-4 py-2 ${
          userName ? 'cursor-pointer hover:bg-white hover:text-black' : 'opacity-50 cursor-not-allowed'
        }`"
        :disabled="!userName"
        @click="create(userName)"
      >
        Join game
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Card } from "@/components/task-holdem/Card.vue";

export type User = {
  id: string;
  sessionId: string | null;
  avatar: Avatar;
  name: string;
  selectedCard: Card | null;
};

const avatars: {
  label: string;
  value: Avatar;
}[] = [
  { label: "Boy", value: "boy" },
  { label: "Girl", value: "girl" },
];

const user = ref<User>();

const userName = ref<string>("");
const userAvatar = ref<Avatar>("boy");

const emit = defineEmits<{
  create: [User | null];
  clear: [User];
}>();

function create(userName: string): void {
  if (userName) {
    user.value = {
      id: crypto.randomUUID(),
      sessionId: null,
      name: userName,
      avatar: userAvatar.value,
      selectedCard: null,
    };
    localStorage.setItem("user", JSON.stringify(user.value));
    emit("create", user.value);
  } else {
    console.debug("User name is empty");
  }
}
</script>
