export type Data = {
  socketNumber: number | null;
};

export type User = {
  isSet: boolean;
  id: string | null;
  name: string | null;
};

export type Message = {
  id: string;
  user: User;
  content: string;
};

export interface ServerToClientEvents {
  data: (data: Data) => void;
  message: (data: Message) => void;
}

export interface ClientToServerEvents {
  data: (data: Data) => void;
  message: (message: Message) => void;
}
