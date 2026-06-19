import type { Message } from "@/components/task-holdem/Chat.vue";
import type { User } from "@/components/task-holdem/CreateUser.vue";

export const taskHoldemApplication: Application = {
  id: "task-holdem",
  name: "TaskHold’em",
  description:
    "TaskHold’em is a collaborative poker planning tool designed for agile teams following the Scrum framework. It provides a simple and enjoyable way to conduct sprint planning sessions, allowing team members to estimate and prioritize tasks effectively.",
  path: "/tools/task-holdem/application",
  favicon: "/svg/task-holdem/logo-light.svg",
  faviconDark: "/svg/task-holdem/logo.svg",
};

export const prefixLog = `[WEBSOCKET - ${taskHoldemApplication.name}]`;

export type GameStatus = "playing" | "revealing" | "revealed" | "restarting";

export type Room = {
  users: User[];
  game: {
    status: GameStatus;
  };
};

export const valueToIconName: Record<string, string> = {
  skip: "i-heroicons-bell-snooze",
  break: "i-heroicons-question-mark-circle",
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
