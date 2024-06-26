import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket.type";
import type { Data, Message, User } from "@/types/task-holdem.type";
import { defineStore } from "pinia";
import { io, type Socket } from "socket.io-client";

export const useTaskHoldemStore = defineStore("task-holdem", () => {
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
   * Data part
   */
  const data = ref<Data>({
    socketNumber: 0,
  });
  socket.emit("data", data.value);

  socket.on("data", (socketData: Data) => {
    data.value = socketData;
  });

  /**
   * Chat part
   */

  function send(user: User, message: string | null) {
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

  const messages = ref<Message[]>([]);
  socket.on("message", (message: Message) => {
    messages.value.push(message);
  });

  return {
    socket,
    isConnected,
    transport,

    data,
    send,

    messages,
  };
});
