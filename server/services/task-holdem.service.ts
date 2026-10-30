import { createHash, randomUUID } from "node:crypto";
import * as dao from "#server/dao/task-holdem.dao";
import {
  TaskHoldemError, createTaskHoldemState, reconcileTaskHoldemRoom, requireTaskHoldemMember,
  revealTaskHoldemRound, restartTaskHoldemRound, selectTaskHoldemVote,
  type TaskHoldemActor, type TaskHoldemMutation, type TaskHoldemUpdate,
} from "#server/domain/task-holdem/room";
import { taskHoldemConfig } from "#server/utils/task-holdem-config";
import type { TaskHoldemJoin, TaskHoldemMessage, TaskHoldemSelection } from "#shared/types/task-holdem.type";

export const inspectRoom = dao.inspectRoom;
export const findDueRooms = dao.findDueRooms;

export async function createRoom(command: TaskHoldemJoin, connectionId: string): Promise<TaskHoldemUpdate> {
  await dao.createRoom(createTaskHoldemState(command.roomId));
  return joinRoom(command, connectionId);
}

export async function joinRoom(command: TaskHoldemJoin, connectionId: string): Promise<TaskHoldemUpdate> {
  const tokenHash = createHash("sha256").update(command.token).digest("hex");
  return dao.mutateRoom(command.roomId, (mutation) => {
    const now = Date.now();
    reconcileTaskHoldemRoom(mutation, now);

    const currentLease = mutation.leases.find(lease => lease.id === connectionId);
    const currentMember = mutation.state.participants.find(participant => participant.id === currentLease?.participantId);
    if (currentMember && currentMember.tokenHash !== tokenHash) {
      throw new TaskHoldemError("INVALID_INPUT", "Leave the room before changing your participant identity.");
    }

    let member = mutation.state.participants.find(participant => participant.tokenHash === tokenHash);
    if (!member) {
      if (mutation.state.participants.length >= 30) throw new TaskHoldemError("ROOM_FULL", "This room has reached its 30-player limit.");
      member = { id: randomUUID(), profile: { ...command.profile }, tokenHash, connected: true };
      mutation.state.participants.push(member);
    }

    member.connected = true;
    mutation.leases = mutation.leases.filter(lease => lease.id !== connectionId);
    mutation.leases.push({ id: connectionId, participantId: member.id, connected: true, expiresAt: now + taskHoldemConfig.leaseMs });
  });
}

export function getJoinedParticipant(update: TaskHoldemUpdate, token: string): string {
  const hash = createHash("sha256").update(token).digest("hex");
  const member = update.state.participants.find(participant => participant.tokenHash === hash);
  if (!member) throw new TaskHoldemError("NOT_JOINED", "Please join the room again.");
  return member.id;
}

function mutateForActor(actor: TaskHoldemActor, mutate: (mutation: TaskHoldemMutation) => void): Promise<TaskHoldemUpdate> {
  return dao.mutateRoom(actor.roomId, (mutation) => {
    const now = Date.now();
    reconcileTaskHoldemRoom(mutation, now);
    requireTaskHoldemMember(mutation, actor, now);
    mutate(mutation);
  });
}

export function syncRoom(actor: TaskHoldemActor): Promise<TaskHoldemUpdate> {
  return mutateForActor(actor, () => {});
}

export function selectVote(actor: TaskHoldemActor, selection: TaskHoldemSelection): Promise<TaskHoldemUpdate> {
  return mutateForActor(actor, (mutation) => {
    const member = requireTaskHoldemMember(mutation, actor, Date.now());
    selectTaskHoldemVote(mutation.state, member, selection);
  });
}

export function revealRound(actor: TaskHoldemActor, roundId: string): Promise<TaskHoldemUpdate> {
  return mutateForActor(actor, mutation => revealTaskHoldemRound({
    state: mutation.state, roundId, now: Date.now(), duration: taskHoldemConfig.revealMs,
  }));
}

export function restartRound(actor: TaskHoldemActor, roundId: string): Promise<TaskHoldemUpdate> {
  return mutateForActor(actor, mutation => restartTaskHoldemRound(mutation.state, roundId));
}

export function leaveRoom(actor: TaskHoldemActor): Promise<TaskHoldemUpdate> {
  return mutateForActor(actor, (mutation) => {
    mutation.state.participants = mutation.state.participants.filter(participant => participant.id !== actor.participantId);
    mutation.leases = mutation.leases.filter(lease => lease.participantId !== actor.participantId);
    reconcileTaskHoldemRoom(mutation, Date.now());
  });
}

export function disconnect(actor: TaskHoldemActor): Promise<TaskHoldemUpdate> {
  return dao.mutateRoom(actor.roomId, (mutation) => {
    const lease = mutation.leases.find(connection => connection.id === actor.connectionId);
    if (lease) {
      lease.connected = false;
      lease.expiresAt = Date.now() + taskHoldemConfig.graceMs;
    }
    reconcileTaskHoldemRoom(mutation, Date.now());
  });
}

export function heartbeat(actor: TaskHoldemActor): Promise<TaskHoldemUpdate> {
  return mutateForActor(actor, (mutation) => {
    const lease = mutation.leases.find(connection => connection.id === actor.connectionId);
    if (lease) lease.expiresAt = Date.now() + taskHoldemConfig.leaseMs;
  });
}

export function reconcileRoom(roomId: string): Promise<TaskHoldemUpdate> {
  return dao.mutateRoom(roomId, mutation => reconcileTaskHoldemRoom(mutation, Date.now()));
}

export async function createMessage(actor: TaskHoldemActor, content: string): Promise<{ update: TaskHoldemUpdate; message: TaskHoldemMessage }> {
  const update = await syncRoom(actor);
  const member = update.state.participants.find(participant => participant.id === actor.participantId);
  if (!member) throw new TaskHoldemError("NOT_JOINED", "Please join the room before sending a message.");
  return {
    update,
    message: { id: randomUUID(), roomId: actor.roomId, author: { ...member.profile }, content, createdAt: Date.now() },
  };
}
