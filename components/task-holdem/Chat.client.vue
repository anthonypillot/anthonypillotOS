<template>
  <section>
    <div v-if="!user.isSet" class="flex flex-col gap-y-2 items-start">
      <p class="text-white">Before all, please set your display name:</p>
      <input class="text-black" type="text" autofocus v-model="user.name" placeholder="Your name" @keydown.enter="createUser(user.name)" />
      <button
        class="text-white border border-white rounded-md px-4 py-2 cursor-pointer hover:bg-white hover:text-black"
        @click="createUser(user.name)"
      >
        Confirm
      </button>
    </div>
    <div v-else class="flex flex-col gap-y-8">
      <div class="flex flex-col gap-y-4 items-start">
        <div>
          <p class="text-gray-400">
            User ID: <span class="text-white">{{ user.id || "Not set" }}</span>
          </p>
          <p class="text-gray-400">
            User name: <span class="text-white">{{ user.name || "Not set" }}</span>
          </p>
          <button
            class="text-white border border-white rounded-md mt-2 px-4 py-2 cursor-pointer hover:bg-white hover:text-black"
            @click="clearUser()"
          >
            Clear user
          </button>
        </div>
        <div class="flex flex-col gap-y-2 w-full max-w-sm">
          <p class="text-white">Write a message:</p>
          <input
            class="text-black"
            type="text"
            autofocus
            autocomplete="off"
            data-1p-ignore
            data-bwignore
            data-lpignore
            data-form-type="other"
            v-model="currentMessageContent"
            placeholder="Your message"
            @keydown.enter="submitMessage(user, currentMessageContent)"
          />
          <button
            class="text-white border border-white rounded-md px-4 py-2 cursor-pointer hover:bg-white hover:text-black"
            @click="submitMessage(user, currentMessageContent)"
            :disabled="!currentMessageContent"
          >
            Send
          </button>
        </div>
      </div>
      <div v-if="store.messages.length > 0">
        <p class="text-white">Messages:</p>
        <div v-for="message in store.messages" :key="message.id">
          <p>
            <span class="text-gray-400">{{ message.user.name }}:</span> <span class="text-white break-all">{{ message.content }}</span>
          </p>
        </div>
      </div>
      <div v-else>
        <p class="text-white">No messages yet</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useTaskHoldemStore } from "@/stores/task-holdem.store";
import type { User } from "@/types/task-holdem.type";

const store = useTaskHoldemStore();

/**
 * User part
 */
const user = ref<User>({
  isSet: false,
  id: null,
  name: null,
});

function createUser(name: string | null): void {
  if (name) {
    user.value.isSet = true;
    user.value.id = crypto.randomUUID();
    user.value.name = name;
    localStorage.setItem("user", JSON.stringify(user.value));
  } else {
    console.debug("User name is empty");
  }
}

// Load user from local storage
user.value = JSON.parse(localStorage.getItem("user") || "{}");

function clearUser(): void {
  user.value = {
    isSet: false,
    id: null,
    name: null,
  };
  localStorage.removeItem("user");
}

const currentMessageContent = ref<string>("");

function submitMessage(user: User, content: string): void {
  store.send(user, content);
  currentMessageContent.value = "";
}
</script>
