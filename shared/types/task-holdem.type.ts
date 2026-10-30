import type { z } from "zod";
import type { Application } from "./application.type";
import type {
  taskHoldemJoinSchema,
  taskHoldemProfileSchema,
  taskHoldemSelectSchema,
  taskHoldemTopicSchema,
  taskHoldemVoteSchema,
} from "../schemas/task-holdem.schema";

export const taskHoldemApplication: Application = {
  id: "task-holdem",
  name: "TaskHold’em",
  description: "A little less guesswork. A lot more team alignment. Run focused, real-time planning poker sessions together.",
  path: "/tools/task-holdem/application",
  favicon: "/svg/task-holdem/logo-light.svg",
  faviconDark: "/svg/task-holdem/logo.svg",
};

export const taskHoldemSocketPath = "/api/websocket/task-holdem";
export const taskHoldemProtocolVersion = 3;
export const taskHoldemDeck = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "skip", "break"] satisfies TaskHoldemVote[];

export type TaskHoldemProfile = z.infer<typeof taskHoldemProfileSchema>;
export type TaskHoldemVote = z.infer<typeof taskHoldemVoteSchema>;
export type TaskHoldemJoin = z.infer<typeof taskHoldemJoinSchema>;
export type TaskHoldemSelection = z.infer<typeof taskHoldemSelectSchema>;
export type TaskHoldemTopic = z.infer<typeof taskHoldemTopicSchema>;
export type TaskHoldemPhase = "voting" | "revealing" | "revealed";

export type TaskHoldemBallot = {
  participantId: string;
  profile: TaskHoldemProfile;
  value: TaskHoldemVote;
};

export type TaskHoldemParticipant = {
  id: string;
  profile: TaskHoldemProfile;
  connected: boolean;
  hasVoted: boolean;
};

export type TaskHoldemRoom = {
  id: string;
  revision: number;
  serverTime: number;
  historyCount: number;
  participants: TaskHoldemParticipant[];
  round: {
    id: string;
    number: number;
    phase: TaskHoldemPhase;
    topic: string | null;
    startedAt: number;
    revealedAt: number | null;
    revealAt: number | null;
    deck: TaskHoldemVote[];
    ballots: TaskHoldemBallot[] | null;
    average: number | null;
  };
};

export type TaskHoldemSelf = {
  roomId: string;
  revision: number;
  participantId: string;
  roundId: string;
  vote: TaskHoldemVote | null;
};

export type TaskHoldemSnapshot = { room: TaskHoldemRoom; self: TaskHoldemSelf };
export type TaskHoldemPreview = { id: string; participantCount: number };
export type TaskHoldemMessage = { id: string; roomId: string; participantId: string; author: TaskHoldemProfile; content: string; createdAt: number };

export type TaskHoldemHistoryEntry = {
  id: string;
  number: number;
  topic: string | null;
  startedAt: number;
  revealedAt: number;
  ballots: TaskHoldemBallot[];
  average: number | null;
};

export type TaskHoldemHistoryPage = { items: TaskHoldemHistoryEntry[]; nextBefore: number | null };

export type TaskHoldemErrorCode =
  | "INVALID_INPUT" | "ROOM_NOT_FOUND" | "ROOM_FULL" | "NOT_JOINED" | "STALE_ROUND"
  | "ROUND_LOCKED" | "TOPIC_CHANGED" | "NO_VOTES" | "RATE_LIMITED" | "UNAVAILABLE";

export type TaskHoldemResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: TaskHoldemErrorCode; message: string } };

export type TaskHoldemAck<T> = (result: TaskHoldemResult<T>) => void;

export type TaskHoldemClientEvents = {
  "room:inspect": (command: { roomId: string }, ack: TaskHoldemAck<TaskHoldemPreview>) => void;
  "room:create": (command: TaskHoldemJoin, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "room:join": (command: TaskHoldemJoin, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "room:sync": (command: Record<string, never>, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "room:leave": (command: Record<string, never>, ack: TaskHoldemAck<null>) => void;
  "round:vote": (command: TaskHoldemSelection, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "round:reveal": (command: { roundId: string }, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "round:restart": (command: { roundId: string }, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "round:topic": (command: TaskHoldemTopic, ack: TaskHoldemAck<TaskHoldemSnapshot>) => void;
  "room:history": (command: { before?: number }, ack: TaskHoldemAck<TaskHoldemHistoryPage>) => void;
  "chat:send": (command: { content: string }, ack: TaskHoldemAck<TaskHoldemMessage>) => void;
};

export type TaskHoldemServerEvents = {
  "room:state": (room: TaskHoldemRoom) => void;
  "room:self": (self: TaskHoldemSelf) => void;
  "room:left": (data: { roomId: string; revision: number }) => void;
  "chat:message": (message: TaskHoldemMessage) => void;
};
