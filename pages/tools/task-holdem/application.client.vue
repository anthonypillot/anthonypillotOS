<template>
  <section class="mt-28 mx-auto flex flex-col gap-y-8 w-10/12">
    <div class="flex items-start flex-col bg-white/5 px-6 py-6 ring-1 ring-white/10 sm:rounded-3xl">
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
      <TaskHoldemPokerTable :users="room.users" :game="room.game" @reveal="reveal" @restart="restart" />
      <section class="flex flex-col gap-2">
        <p class="text-white">Select a card:</p>
        <div class="flex flex-wrap gap-x-2 gap-y-4">
          <TaskHoldemCard
            v-for="card in cards"
            :key="card.value"
            :type="card.type"
            :value="card.value"
            :isSelected="card.isSelected"
            @select="selectedCard"
          />
        </div>
      </section>
      <TaskHoldemInvitation />
      <TaskHoldemChat :user="user" v-model:messages="messages" v-model:message="message" @submit="sendMessage(user, message)" />
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
import type { ClientToServerEvents, Data, Room, ServerToClientEvents } from "@/types/task-holdem.type";
import { application } from "@/types/task-holdem.type";
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

const roomId = generateRoomId();

function generateRoomId(): string {
  const route = useRoute();
  const id = route.query.id as string;

  if (id) {
    return id;
  } else {
    const id = crypto.randomUUID();
    const router = useRouter();
    router.push({ query: { id } });
    return id;
  }
}

function getUserFromLocalStorage(): User | null {
  const userFromLocalStorage = localStorage.getItem("user");
  if (userFromLocalStorage) {
    const user: User = JSON.parse(userFromLocalStorage);

    // Temporary solution to wait the socket connection before sending the user
    setTimeout(() => {
      socket.emit("user-create", user);
    }, 1000);

    return user;
  } else {
    return null;
  }
}

const user = ref<User | null>(getUserFromLocalStorage());

const room = ref<Room>({
  users: [],
  game: {
    isRevealed: false,
  },
});

//#region Socket

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  path: "/api/websocket/task-holdem",
  transports: ["websocket"],
  query: {
    id: roomId,
  },
});

const isConnected = ref<boolean>(false);
const transport = ref<string>("N/A");

if (socket.connected) {
  onConnect();
}

function onConnect(): void {
  isConnected.value = true;
  transport.value = socket.io.engine.transport.name;
}

function onDisconnect(): void {
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

socket.on("room", (roomFromServer: Room) => {
  room.value = roomFromServer;
});

function createUser(userToCreate: User | null) {
  if (userToCreate) {
    user.value = userToCreate;
    localStorage.setItem("user", JSON.stringify(userToCreate));
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
    value: "skip",
    isSelected: false,
  },
  {
    type: "icon",
    value: "break",
    isSelected: false,
  },
]);

function selectedCard(selectedCard: Card): void {
  const currentUserInRoom = room.value.users.find((userRoom) => userRoom.id === user.value?.id);

  if (currentUserInRoom) {
    cards.value.forEach((card) => {
      card.value === selectedCard.value ? (card.isSelected = !card.isSelected) : (card.isSelected = false);
    });

    room.value.users.forEach((user) => {
      if (user.id === currentUserInRoom.id) {
        user.selectedCard = selectedCard;
      }
    });

    socket.emit("room", room.value);
  }
}

function reveal(): void {
  room.value.game.isRevealed = true;
  socket.emit("room", room.value);
}

function restart(): void {
  socket.emit("room-restart", room.value);
}

socket.on("room-restart", (roomFromServer: Room) => {
  cards.value.forEach((card) => {
    card.isSelected = false;
  });

  room.value = roomFromServer;
});

//#region Chat

const messages = ref<Message[]>([]);
const message = ref<string>("");

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

socket.on("message", (message: Message) => {
  messages.value.push(message);
});

//#endregion
</script>
