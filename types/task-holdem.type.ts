import type { Message } from "@/components/task-holdem/Chat.vue";
import type { User } from "@/components/task-holdem/CreateUser.vue";

export const application = {
  id: "task-holdem",
  name: "TaskHold’em",
  description:
    "TaskHold’em is a collaborative poker planning tool designed for agile teams following the Scrum framework. It provides a simple and enjoyable way to conduct sprint planning sessions, allowing team members to estimate and prioritize tasks effectively.",
};

export type Data = {
  socketNumber: number | null;
};

export interface ServerToClientEvents {
  data: (data: Data) => void;
  message: (message: Message) => void;
  "users-update": (users: User[]) => void;
  "user-create": (user: User) => void;
  "user-remove": (user: User) => void;
}

export interface ClientToServerEvents {
  data: (data: Data) => void;
  message: (message: Message) => void;
  "users-update": (users: User[]) => void;
  "user-create": (user: User) => void;
  "user-remove": (user: User) => void;
}
