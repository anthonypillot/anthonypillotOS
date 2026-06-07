<template>
  <section v-if="!isOpen" class="bg-gray-800 z-10 fixed right-8 bottom-12">
    <UButton
      icon="heroicons:chat-bubble-left-right"
      variant="outline"
      size="xs"
      class="text-white shadow-indigo-800 shadow-md rounded-md"
      @click="toggleChat()"
    />
  </section>
  <Transition>
    <section
      v-if="isOpen"
      class="p-4 bg-gray-800 border border-gray-700 shadow-indigo-800 shadow-md rounded max-w-sm z-10 fixed right-8 bottom-12"
    >
      <div class="flex flex-col gap-y-8">
        <UButton
          icon="heroicons:x-mark"
          variant="ghost"
          size="sm"
          class="text-white absolute right-1 top-1"
          @click="toggleChat()"
        />
        <div>
          <p class="text-white text-xs pb-2">Messages:</p>
          <div v-if="messages && messages.length > 0">
            <div id="messages" class="flex flex-col border rounded p-2 max-h-40 overflow-y-scroll">
              <section v-for="chatMessage in messages" :key="chatMessage.id">
                <div id="message" class="flex gap-2">
                  <span class="text-sm text-gray-400">{{ chatMessage.user.name }}:</span>
                  <span class="text-sm text-white break-all">{{ chatMessage.content }}</span>
                </div>
              </section>
            </div>
          </div>
          <div v-else class="border rounded p-2">
            <p class="text-white text-sm">No messages yet</p>
          </div>
        </div>
        <div class="flex flex-col gap-y-4 items-start">
          <div class="flex flex-col gap-y-2 w-full max-w-sm">
            <p class="text-white text-xs">Write a message:</p>
            <UInput
              v-model="message"
              placeholder="Your message"
              autofocus
              @keydown.enter="submit(user, message)"
            />
            <UButton
              label="Send"
              variant="outline"
              size="xs"
              class="text-white"
              :disabled="message === ''"
              @click="submit(user, message)"
            />
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import type { User } from "@/components/task-holdem/CreateUser.vue";

const isOpen = ref<boolean>(isChatOpen());

function isChatOpen(): boolean {
  return localStorage.getItem("isChatOpen") === "true";
}

function setChatOpen(open: boolean): void {
  localStorage.setItem("isChatOpen", open.toString());
}

setChatOpen(isOpen.value);

function toggleChat(): void {
  isOpen.value = !isOpen.value;
  setChatOpen(isOpen.value);
}

export type Message = {
  id: string;
  user: User;
  content: string;
};

defineProps<{
  user: User;
}>();

const messages = defineModel<Message[] | null>("messages");
const message = defineModel<string>("message");

const emit = defineEmits<{
  submit: [user: User, message: string];
}>();

function submit(user: User, messageContent?: string): void {
  if (messageContent && messages.value) {
    emit("submit", user, messageContent);
    message.value = "";
  }
}

watch(
  computed(() => messages.value),
  () => {
    const messagesElement = document.getElementById("messages");
    if (messagesElement) {
      messagesElement.scrollTop = messagesElement.scrollHeight; // TODO: Fix this, it's not working as expected
    }
  }
);
</script>

<style scoped>
/*
  Enter and leave animations can use different
  durations and timing functions.
*/
.v-enter-active {
  transition: all 0.5s ease-out;
}

.v-leave-active {
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}

.v-enter-from,
.v-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
