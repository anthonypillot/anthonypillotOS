export const application = {
  id: "task-holdem",
  name: "TaskHold’em",
  description:
    "Task Holdem is a poker planning tool for teams that use the Scrum framework. It is a simple and fun way to do sprint planning.",
};

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
