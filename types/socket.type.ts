import type { Data, Message } from "@/types/task-holdem.type";

export interface ServerToClientEvents {
  data: (data: Data) => void;
  message: (data: Message) => void;
}

export interface ClientToServerEvents {
  data: (data: Data) => void;
  message: (message: Message) => void;
}
