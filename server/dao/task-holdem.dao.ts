import { createPrismaClient } from "#server/utils/prisma";
import {
  TaskHoldemError, getTaskHoldemAverage, taskHoldemBallotSchema, taskHoldemStateSchema,
  type TaskHoldemMutation, type TaskHoldemState, type TaskHoldemUpdate,
} from "#server/domain/task-holdem/room";
import type { TaskHoldemHistoryPage } from "#shared/types/task-holdem.type";

const prisma = createPrismaClient();

export async function createRoom(state: TaskHoldemState): Promise<void> {
  await prisma.taskHoldemRoom.upsert({
    where: { id: state.id },
    create: { id: state.id, data: state },
    update: {},
  });
}

export async function inspectRoom(id: string): Promise<{ id: string; participantCount: number }> {
  const room = await prisma.taskHoldemRoom.findUnique({ where: { id } });
  const parsed = taskHoldemStateSchema.safeParse(room?.data);
  if (!room || !parsed.success) {
    throw new TaskHoldemError("ROOM_NOT_FOUND", "This room is unavailable. Ask for a new invitation or create your own room.");
  }
  return { id, participantCount: parsed.data.participants.length };
}

export async function mutateRoom(id: string, mutate: (mutation: TaskHoldemMutation) => void): Promise<TaskHoldemUpdate> {
  return prisma.$transaction(async (transaction) => {
    // The lock must be shared by every instance, including presence and timer updates.
    const rows = await transaction.$queryRaw<{ id: string }[]>`SELECT id FROM task_holdem_room WHERE id = ${id} FOR UPDATE`;
    if (rows.length === 0) throw new TaskHoldemError("ROOM_NOT_FOUND", "This room no longer exists.");

    const room = await transaction.taskHoldemRoom.findUniqueOrThrow({ where: { id }, include: { connections: true } });
    const parsed = taskHoldemStateSchema.safeParse(room.data);
    if (!parsed.success) throw new TaskHoldemError("ROOM_NOT_FOUND", "This room uses an older version. Please create a new room.");

    const mutation: TaskHoldemMutation = {
      state: parsed.data,
      completedRounds: [],
      leases: room.connections.map(connection => ({
        id: connection.id,
        participantId: connection.participantId,
        connected: connection.connected,
        expiresAt: connection.expiresAt.getTime(),
      })),
    };
    const previous = JSON.stringify(mutation.state);
    const previousParticipantIds = mutation.state.participants.map(participant => participant.id);
    mutate(mutation);
    const state = taskHoldemStateSchema.parse(mutation.state);
    const changed = JSON.stringify(state) !== previous;
    const revision = room.revision + (changed ? 1 : 0);

    if (mutation.completedRounds.length > 0) {
      await transaction.taskHoldemRound.createMany({
        data: mutation.completedRounds.map(round => ({
          id: round.id, roomId: id, number: round.number, topic: round.topic,
          startedAt: new Date(round.startedAt), revealedAt: new Date(round.revealedAt), ballots: round.ballots,
        })),
        skipDuplicates: true,
      });
    }

    if (changed) {
      await transaction.taskHoldemRoom.update({ where: { id }, data: { data: state, revision } });
    }

    const retained = new Set(mutation.leases.map(lease => lease.id));
    const removed = room.connections.filter(connection => !retained.has(connection.id)).map(connection => connection.id);
    if (removed.length > 0) await transaction.taskHoldemConnection.deleteMany({ where: { id: { in: removed }, roomId: id } });
    for (const lease of mutation.leases) {
      const previousLease = room.connections.find(connection => connection.id === lease.id);
      if (previousLease?.participantId === lease.participantId && previousLease.connected === lease.connected && previousLease.expiresAt.getTime() === lease.expiresAt) continue;
      await transaction.taskHoldemConnection.upsert({
        where: { id: lease.id },
        create: { ...lease, roomId: id, expiresAt: new Date(lease.expiresAt) },
        update: { participantId: lease.participantId, connected: lease.connected, expiresAt: new Date(lease.expiresAt) },
      });
    }
    const removedParticipantIds = previousParticipantIds.filter(participantId => !state.participants.some(participant => participant.id === participantId));
    return { state, revision, changed, removedParticipantIds };
  }, { maxWait: 10_000, timeout: 10_000 });
}

export async function listRoomHistory(roomId: string, before?: number): Promise<TaskHoldemHistoryPage> {
  const pageSize = 20;
  const rounds = await prisma.taskHoldemRound.findMany({
    where: { roomId, ...(before ? { number: { lt: before } } : {}) },
    orderBy: { number: "desc" },
    take: pageSize + 1,
  });
  const items = rounds.slice(0, pageSize).map((round) => {
    const ballots = taskHoldemBallotSchema.array().parse(round.ballots);
    return {
      id: round.id, number: round.number, topic: round.topic, ballots,
      startedAt: round.startedAt.getTime(), revealedAt: round.revealedAt.getTime(), average: getTaskHoldemAverage(ballots),
    };
  });
  return { items, nextBefore: rounds.length > pageSize ? items.at(-1)?.number ?? null : null };
}

export async function findDueRooms(now: number): Promise<string[]> {
  const rooms = await prisma.taskHoldemRoom.findMany({
    where: {
      OR: [
        { connections: { some: { expiresAt: { lte: new Date(now) } } } },
        { AND: [
          { data: { path: ["round", "phase"], equals: "revealing" } },
          { data: { path: ["round", "revealAt"], lte: now } },
        ] },
      ],
    },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });
  return rooms.map(room => room.id);
}

export async function closeTaskHoldemDatabase(): Promise<void> {
  await prisma.$disconnect();
}
