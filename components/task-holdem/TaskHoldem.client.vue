<template>
  <section class="mt-32 flex flex-col gap-y-12 mx-auto w-10/12">
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
            @click="resetUser()"
          >
            Reset user
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
            @keydown.enter="send(currentMessageContent)"
          />
          <button
            class="text-white border border-white rounded-md px-4 py-2 cursor-pointer hover:bg-white hover:text-black"
            @click="send(currentMessageContent)"
            :disabled="!currentMessageContent"
          >
            Send
          </button>
        </div>
      </div>
      <div v-if="messages.length > 0">
        <p class="text-white">Messages:</p>
        <div v-for="message in messages" :key="message.id">
          <p>
            <span class="text-gray-400">{{ message.user.name }}:</span> <span class="text-white break-all">{{ message.content }}</span>
          </p>
        </div>
      </div>
      <div v-else>
        <p class="text-white">No messages yet</p>
      </div>
    </div>

    <div>
      <h1 class="text-3xl font-bold text-white sm:text-4xl">Technical</h1>
      <p class="text-gray-400">
        Status: <span class="text-white">{{ isConnected ? "connected" : "disconnected" }}</span>
      </p>
      <p class="text-gray-400">
        Transport: <span class="text-white">{{ transport }}</span>
      </p>
      <p class="text-gray-400">
        Socket ID: <span class="text-white">{{ socket.id }}</span>
      </p>
      <p class="text-gray-400">
        Socket state: <span class="text-white">{{ socket.active ? "active" : "inactive" }}</span>
      </p>
      <p class="text-gray-400">
        Socket number: <span class="text-white">{{ data.socketNumber }}</span>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ClientToServerEvents, Data, Message, ServerToClientEvents, User } from "@/types/websocket.type";
import { io, type Socket } from "socket.io-client";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  path: "/api/websocket",
  transports: ["websocket"],
});

const isConnected = ref<boolean>(false);
const transport = ref<string>("N/A");

if (socket.connected) {
  onConnect();
}

function onConnect() {
  isConnected.value = true;
  transport.value = socket.io.engine.transport.name;
}

function onDisconnect() {
  isConnected.value = false;
  transport.value = "N/A";
}

socket.on("connect", onConnect);
socket.on("disconnect", onDisconnect);

onBeforeUnmount(() => {
  socket.off("connect", onConnect);
  socket.off("disconnect", onDisconnect);
});

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

function resetUser(): void {
  user.value = {
    isSet: false,
    id: null,
    name: null,
  };
  localStorage.removeItem("user");

  console.debug("User reset");
}

/**
 * Data part
 */
const data = ref<Data>({
  socketNumber: 0,
});
socket.emit("data", data.value);

socket.on("data", (dataFromSocket: Data) => {
  data.value = dataFromSocket;
});

/**
 * Chat part
 */
const currentMessageContent = ref<string>("");

function send(message: string | null) {
  if (message) {
    socket.emit("message", {
      id: crypto.randomUUID(),
      user: user.value,
      content: currentMessageContent.value,
    });
    currentMessageContent.value = "";
  } else {
    console.debug("Message is empty");
  }
}

const messages = ref<Message[]>([]);

socket.on("message", (message: Message) => {
  messages.value.push(message);
});
</script>
