<template>
  <section class="mt-28 mx-auto flex flex-col gap-y-8 w-10/12">
    <div class="flex items-start max-w-2xl flex-col bg-white/5 px-6 py-6 ring-1 ring-white/10 sm:rounded-3xl">
      <NuxtImg class="h-16" src="svg/task-holdem/poker-hand.svg" :alt="application.name" />
      <h1 class="text-4xl text-white">{{ application.name }}</h1>
      <span
        class="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30"
        >Beta</span
      >
    </div>

    <TaskHoldemCreateUser v-if="!user" @create="createUser" />

    <section v-if="user" class="flex flex-col gap-y-8">
      <TaskHoldemUser :user @remove="removeUser" />
      <TaskHoldemChat :user v-model:messages="messages" v-model:message="message" @submit="sendMessage(user, message)" />
      <TaskHoldemPokerTable :users />
      <section class="flex flex-col gap-2">
        <p class="text-white">Select a card:</p>
        <div class="flex flex-wrap gap-x-2 gap-y-4">
          <TaskHoldemCard
            v-for="card in cards"
            :key="card.value"
            :type="card.type"
            :value="card.value"
            :component="card.component"
            :isSelected="card.isSelected"
            @select="selectedCard"
          />
        </div>
      </section>
      <TaskHoldemInvitation />
    </section>

    <DevOnly>
      <SocketTechnicalData :isConnected="isConnected" :transport="transport" :socket="socket" :socketNumber="data.socketNumber || 0" />
    </DevOnly>
  </section>
</template>

<script setup lang="ts">
import type { Card } from "@/components/task-holdem/Card.vue";
import type { Message } from "@/components/task-holdem/Chat.vue";
import type { User } from "@/components/task-holdem/CreateUser.vue";
import { application, type ClientToServerEvents, type Data, type ServerToClientEvents } from "@/types/task-holdem.type";
import { BellSnoozeIcon, QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";
import { io, type Socket } from "socket.io-client";

//#region SEO

const config = useRuntimeConfig();

const title = `${application.name} | ${config.app.website.title}`;
const description = application.description;

useSeo({
  title,
  description,
  favicon: {
    type: "image/svg",
    href: "/svg/task-holdem/poker-hand.svg",
  },
});

//#endregion

//#region Socket configuration

const roomId = getRoomId();

function getRoomId(): string {
  const route = useRoute();
  const roomId = route.query.roomId as string;

  if (roomId) {
    return roomId;
  } else {
    const roomId = crypto.randomUUID();
    const router = useRouter();
    router.push({ query: { roomId } });
    return roomId;
  }
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  path: "/api/websocket/task-holdem",
  transports: ["websocket"],
  query: {
    roomId,
  },
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

//#endregion

//#region Data

/**
 * Technical data part
 */
const data = ref<Data>({
  socketNumber: 0,
});
socket.emit("data", data.value);

socket.on("data", (socketData: Data) => {
  data.value = socketData;
});

//#endregion

function sendMessage(user: User, message: string | null) {
  if (message) {
    socket.emit("message", {
      id: crypto.randomUUID(),
      user: user,
      content: message,
    });
  } else {
    console.debug("Message is empty");
  }
}

function getUserFromLocalStorage(): User | null {
  const userFromLocalStorage = localStorage.getItem("user");
  if (userFromLocalStorage) {
    const user: User = JSON.parse(userFromLocalStorage);

    // Temporary to wait the socket connection before sending the user
    setTimeout(() => {
      socket.emit("user-create", user);
    }, 1000);

    return user;
  } else {
    return null;
  }
}

const user = ref<User | null>(getUserFromLocalStorage());
const users = ref<User[]>([]);

socket.on("users-update", (usersFromServer: User[]) => {
  users.value = usersFromServer;
});

function createUser(userCreated: User | null) {
  if (userCreated) {
    user.value = userCreated;
    localStorage.setItem("user", JSON.stringify(userCreated));
    socket.emit("user-create", user.value);
  }
}

function removeUser(userToRemove: User) {
  if (user.value) {
    user.value = null;
    localStorage.removeItem("user");
    socket.emit("user-remove", userToRemove);
  }
}

const messages = ref<Message[]>([]);
const message = ref<string>("");

socket.on("message", (message: Message) => {
  messages.value.push(message);
});

const cards = ref<Card[]>([
  {
    type: "number",
    value: 1,
    isSelected: false,
  },
  {
    type: "number",
    value: 2,
    isSelected: false,
  },
  {
    type: "number",
    value: 3,
    isSelected: false,
  },
  {
    type: "number",
    value: 5,
    isSelected: false,
  },
  {
    type: "number",
    value: 8,
    isSelected: false,
  },
  {
    type: "number",
    value: 13,
    isSelected: false,
  },
  {
    type: "number",
    value: 21,
    isSelected: false,
  },
  {
    type: "number",
    value: 34,
    isSelected: false,
  },
  {
    type: "number",
    value: 55,
    isSelected: false,
  },
  {
    type: "number",
    value: 89,
    isSelected: false,
  },
  {
    type: "icon",
    value: "Snooze",
    component: BellSnoozeIcon,
    isSelected: false,
  },
  {
    type: "icon",
    value: "Question",
    component: QuestionMarkCircleIcon,
    isSelected: false,
  },
]);

function selectedCard(selectedCard: Card): void {
  const userInArray = users.value.find((u) => u.id === user.value?.id);
  if (userInArray) {
    cards.value.forEach((card) => {
      card.value === selectedCard.value ? (card.isSelected = !card.isSelected) : (card.isSelected = false);
    });

    users.value.forEach((u) => {
      if (u.id === userInArray.id) {
        u.selectedCard = selectedCard;
      }
    });

    console.debug(`User [${userInArray.name}] selected card value [${selectedCard.value}]`);
    socket.emit("users-update", users.value);
  }
}
</script>
