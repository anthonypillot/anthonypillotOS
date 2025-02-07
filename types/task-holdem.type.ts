import type { Message } from "@/components/task-holdem/Chat.vue";
import type { User } from "@/components/task-holdem/CreateUser.vue";
import { BellSnoozeIcon, QuestionMarkCircleIcon } from "@heroicons/vue/24/outline";

export const application = {
  id: "task-holdem",
  name: "TaskHold’em",
  description:
    "TaskHold’em is a collaborative poker planning tool designed for agile teams following the Scrum framework. It provides a simple and enjoyable way to conduct sprint planning sessions, allowing team members to estimate and prioritize tasks effectively.",
  path: "/tools/task-holdem/application",
};

export const prefixLog = `[WEBSOCKET - ${application.name}]`;

export type GameStatus = "playing" | "revealing" | "revealed";

export type Room = {
  users: User[];
  game: {
    status: GameStatus;
  };
};

export const valueToComponent: Record<string, Component> = {
  skip: BellSnoozeIcon,
  break: QuestionMarkCircleIcon,
};

export type Data = {
  socketNumber: number | null;
};

export interface ServerToClientEvents {
  data: (data: Data) => void;
  message: (message: Message) => void;
  "room-update": (room: Room) => void;
  "room-restart": (room: Room) => void;
  "user-create": (user: User) => void;
  "user-remove": (user: User) => void;
}

export interface ClientToServerEvents {
  data: (data: Data) => void;
  message: (message: Message) => void;
  "room-update": (room: Room) => void;
  "room-restart": (room: Room) => void;
  "user-create": (user: User) => void;
  "user-remove": (user: User) => void;
}
