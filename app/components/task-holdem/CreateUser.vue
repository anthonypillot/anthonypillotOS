<template>
  <section>
    <div class="flex flex-col gap-y-4 items-start">
      <p class="text-white">To join the game, please enter your informations:</p>
      <UInput v-model="userName" placeholder="Your name" @keydown.enter="create(userName)" />
      <URadioGroup v-model="userAvatar" :items="avatars" variant="card" color="primary" orientation="horizontal" :ui="{ item: 'cursor-pointer', label: 'text-white' }" />
      <UButton label="Join game" :disabled="!userName" @click="create(userName)" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Card } from "@/components/task-holdem/Card.vue";
import type { Avatar } from "@/composables/useAvatar";

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
