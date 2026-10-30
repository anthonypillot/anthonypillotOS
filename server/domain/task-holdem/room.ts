import { randomUUID } from "node:crypto";
import { z } from "zod";
import { taskHoldemProfileSchema, taskHoldemVoteSchema } from "#shared/schemas/task-holdem.schema";
import { taskHoldemDeck } from "#shared/types/task-holdem.type";
import type {
  TaskHoldemErrorCode, TaskHoldemRoom, TaskHoldemSelf, TaskHoldemSelection,
} from "#shared/types/task-holdem.type";

const participantSchema = z.object({
  id: z.uuid(),
  profile: taskHoldemProfileSchema,
  tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
  connected: z.boolean(),
});

export const taskHoldemStateSchema = z.object({
  schemaVersion: z.literal(2),
  id: z.uuid(),
  participants: z.array(participantSchema).max(30),
  round: z.object({
    id: z.uuid(),
    number: z.number().int().positive(),
    phase: z.enum(["voting", "revealing", "revealed"]),
    revealAt: z.number().nullable(),
    deck: z.array(taskHoldemVoteSchema),
    ballots: z.array(z.object({
      participantId: z.uuid(),
      profile: taskHoldemProfileSchema,
      value: taskHoldemVoteSchema,
    })),
  }),
});

export type TaskHoldemState = z.infer<typeof taskHoldemStateSchema>;
export type TaskHoldemMember = TaskHoldemState["participants"][number];
export type TaskHoldemLease = { id: string; participantId: string; connected: boolean; expiresAt: number };
export type TaskHoldemMutation = { state: TaskHoldemState; leases: TaskHoldemLease[] };
export type TaskHoldemUpdate = { state: TaskHoldemState; revision: number; changed: boolean; removedParticipantIds: string[] };
export type TaskHoldemActor = { roomId: string; participantId: string; connectionId: string };

export class TaskHoldemError extends Error {
  constructor(readonly code: TaskHoldemErrorCode, message: string) {
    super(message);
    this.name = "TaskHoldemError";
  }
}

export function createTaskHoldemState(id: string): TaskHoldemState {
  return {
    schemaVersion: 2,
    id,
    participants: [],
    round: { id: randomUUID(), number: 1, phase: "voting", revealAt: null, deck: [...taskHoldemDeck], ballots: [] },
  };
}

export function requireTaskHoldemMember(mutation: TaskHoldemMutation, actor: TaskHoldemActor, now: number): TaskHoldemMember {
  const member = mutation.state.participants.find(participant => participant.id === actor.participantId);
  const lease = mutation.leases.find(connection => connection.id === actor.connectionId && connection.participantId === actor.participantId);
  if (!member || !lease?.connected || lease.expiresAt <= now) {
    throw new TaskHoldemError("NOT_JOINED", "Your seat is no longer active. Please join the room again.");
  }
  return member;
}

export function reconcileTaskHoldemRoom(mutation: TaskHoldemMutation, now: number): void {
  mutation.leases = mutation.leases.filter(lease => lease.expiresAt > now);
  mutation.state.participants = mutation.state.participants.filter((participant) => {
    const leases = mutation.leases.filter(lease => lease.participantId === participant.id);
    participant.connected = leases.some(lease => lease.connected);
    return leases.length > 0;
  });
  if (mutation.state.round.phase === "voting") {
    const members = new Set(mutation.state.participants.map(participant => participant.id));
    mutation.state.round.ballots = mutation.state.round.ballots.filter(ballot => members.has(ballot.participantId));
  }
  if (mutation.state.round.phase === "revealing" && mutation.state.round.revealAt !== null && mutation.state.round.revealAt <= now) {
    mutation.state.round.phase = "revealed";
  }
}

export function requireTaskHoldemRound(state: TaskHoldemState, roundId: string): void {
  if (state.round.id !== roundId) {
    throw new TaskHoldemError("STALE_ROUND", "A new round has started. Your view has been refreshed; please try again.");
  }
}

export function selectTaskHoldemVote(state: TaskHoldemState, member: TaskHoldemMember, selection: TaskHoldemSelection): void {
  requireTaskHoldemRound(state, selection.roundId);
  if (state.round.phase !== "voting") {
    throw new TaskHoldemError("ROUND_LOCKED", "Voting is closed for this round.");
  }
  if (selection.value !== null && !state.round.deck.includes(selection.value)) {
    throw new TaskHoldemError("INVALID_INPUT", "Choose a card from this room's deck.");
  }
  state.round.ballots = state.round.ballots.filter(ballot => ballot.participantId !== member.id);
  if (selection.value !== null) {
    state.round.ballots.push({ participantId: member.id, profile: { ...member.profile }, value: selection.value });
  }
}

type RevealTaskHoldemRound = { state: TaskHoldemState; roundId: string; now: number; duration: number };

export function revealTaskHoldemRound({ state, roundId, now, duration }: RevealTaskHoldemRound): void {
  requireTaskHoldemRound(state, roundId);
  if (state.round.phase !== "voting") return;
  if (state.round.ballots.length === 0) {
    throw new TaskHoldemError("NO_VOTES", "Select at least one card before revealing.");
  }
  state.round.phase = "revealing";
  state.round.revealAt = now + duration;
}

export function restartTaskHoldemRound(state: TaskHoldemState, roundId: string): void {
  requireTaskHoldemRound(state, roundId);
  if (state.round.phase !== "revealed") {
    throw new TaskHoldemError("ROUND_LOCKED", "Reveal the cards before starting another round.");
  }
  state.round = {
    id: randomUUID(), number: state.round.number + 1, phase: "voting", revealAt: null,
    deck: [...state.round.deck], ballots: [],
  };
}

export function toTaskHoldemRoom(update: TaskHoldemUpdate, now = Date.now()): TaskHoldemRoom {
  const { state, revision } = update;
  const revealed = state.round.phase === "revealed";
  const values = state.round.ballots.map(ballot => ballot.value).filter(value => typeof value === "number");
  return {
    id: state.id,
    revision,
    serverTime: now,
    participants: state.participants.map(participant => ({
      id: participant.id,
      profile: { ...participant.profile },
      connected: participant.connected,
      hasVoted: state.round.ballots.some(ballot => ballot.participantId === participant.id),
    })),
    round: {
      id: state.round.id,
      number: state.round.number,
      phase: state.round.phase,
      revealAt: state.round.revealAt,
      deck: [...state.round.deck],
      ballots: revealed ? state.round.ballots.map(ballot => ({ ...ballot, profile: { ...ballot.profile } })) : null,
      average: revealed && values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    },
  };
}

export function toTaskHoldemSelf(update: TaskHoldemUpdate, participantId: string): TaskHoldemSelf {
  return {
    roomId: update.state.id,
    revision: update.revision,
    participantId,
    roundId: update.state.round.id,
    vote: update.state.round.ballots.find(ballot => ballot.participantId === participantId)?.value ?? null,
  };
}
