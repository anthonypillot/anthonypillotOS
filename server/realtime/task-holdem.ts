import { z } from "zod";
import type { Server, Socket } from "socket.io";
import * as service from "#server/services/task-holdem.service";
import {
  TaskHoldemError, toTaskHoldemRoom, toTaskHoldemSelf,
  type TaskHoldemActor, type TaskHoldemUpdate,
} from "#server/domain/task-holdem/room";
import { logger } from "#server/utils/logger";
import { taskHoldemConfig } from "#server/utils/task-holdem-config";
import {
  taskHoldemEmptySchema, taskHoldemInspectSchema, taskHoldemJoinSchema,
  taskHoldemMessageSchema, taskHoldemRoundSchema, taskHoldemSelectSchema, taskHoldemTopicSchema, taskHoldemHistorySchema,
} from "#shared/schemas/task-holdem.schema";
import {
  taskHoldemProtocolVersion,
  type TaskHoldemAck, type TaskHoldemClientEvents, type TaskHoldemServerEvents, type TaskHoldemSnapshot,
} from "#shared/types/task-holdem.type";

type TaskHoldemSocketData = { actor: TaskHoldemActor | null };
export type TaskHoldemServer = Server<TaskHoldemClientEvents, TaskHoldemServerEvents, Record<string, never>, TaskHoldemSocketData>;
type TaskHoldemSocket = Socket<TaskHoldemClientEvents, TaskHoldemServerEvents, Record<string, never>, TaskHoldemSocketData>;

type TaskHoldemCommand<Schema extends z.ZodType, Result> = {
  schema: Schema;
  command: z.input<Schema>;
  ack: TaskHoldemAck<Result>;
  operation: (value: z.output<Schema>) => Promise<Result>;
};

const handshakeSchema = z.object({ protocolVersion: z.literal(taskHoldemProtocolVersion) });
const roomChannel = (roomId: string) => `task-holdem:room:${roomId}`;
const memberChannel = (actor: Pick<TaskHoldemActor, "roomId" | "participantId">) => `task-holdem:member:${actor.roomId}:${actor.participantId}`;

async function releaseActor(socket: TaskHoldemSocket, actor: TaskHoldemActor): Promise<void> {
  if (socket.data.actor !== actor) return;
  await socket.leave(memberChannel(actor));
  if (socket.data.actor !== actor) return;
  await socket.leave(roomChannel(actor.roomId));
  if (socket.data.actor === actor) socket.data.actor = null;
}

function snapshot(update: TaskHoldemUpdate, actor: TaskHoldemActor): TaskHoldemSnapshot {
  return { room: toTaskHoldemRoom(update), self: toTaskHoldemSelf(update, actor.participantId) };
}

export function registerTaskHoldemGateway(io: TaskHoldemServer): { close: () => Promise<void> } {
  const tasks = new Set<Promise<void>>();
  let stopped = false;
  let maintaining = false;
  let heartbeating = false;
  let lastBackgroundError = 0;
  let maintenanceTask: Promise<void> | undefined;
  let heartbeatTask: Promise<void> | undefined;

  function publish(update: TaskHoldemUpdate): void {
    for (const participantId of update.removedParticipantIds) {
      const channel = memberChannel({ roomId: update.state.id, participantId });
      io.to(channel).emit("room:left", { roomId: update.state.id, revision: update.revision });
      io.in(channel).socketsLeave([roomChannel(update.state.id), channel]);
    }
    if (!update.changed) return;
    io.to(roomChannel(update.state.id)).emit("room:state", toTaskHoldemRoom(update));
    for (const participant of update.state.participants) {
      io.to(memberChannel({ roomId: update.state.id, participantId: participant.id }))
        .emit("room:self", toTaskHoldemSelf(update, participant.id));
    }
  }

  function reportBackgroundError(error: Error): void {
    if (error instanceof TaskHoldemError && ["ROOM_NOT_FOUND", "NOT_JOINED"].includes(error.code)) return;
    if (Date.now() - lastBackgroundError < 30_000) return;
    lastBackgroundError = Date.now();
    logger.error(`[TaskHoldem] Background reconciliation failed: ${error.message}`);
  }

  io.use((socket, next) => {
    const origin = socket.handshake.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== socket.handshake.headers.host) {
          next(new Error("Room connections must come from this site's origin."));
          return;
        }
      } catch {
        next(new Error("Invalid connection origin."));
        return;
      }
    }
    if (!handshakeSchema.safeParse(socket.handshake.auth).success) {
      next(new Error("This version of TaskHold’em is no longer supported. Please reload the page."));
      return;
    }
    socket.data.actor = null;
    next();
  });

  io.on("connection", (socket) => {
    let pending = Promise.resolve();
    let windowStart = Date.now();
    let commandCount = 0;

    function requireActor(): TaskHoldemActor {
      if (!socket.data.actor) throw new TaskHoldemError("NOT_JOINED", "Join the room before continuing.");
      return socket.data.actor;
    }

    function enqueue(operation: () => Promise<void>): void {
      const previous = pending;
      const task = (async () => {
        await previous;
        try {
          await operation();
        } catch (error) {
          reportBackgroundError(error instanceof Error ? error : new Error("Socket operation failed"));
        } finally {
          tasks.delete(task);
        }
      })();
      pending = task;
      tasks.add(task);
    }

    function handle<Schema extends z.ZodType, Result>({ schema, command, ack, operation }: TaskHoldemCommand<Schema, Result>): void {
      if (typeof ack !== "function") return;
      if (Date.now() - windowStart > 10_000) {
        windowStart = Date.now();
        commandCount = 0;
      }
      if (++commandCount > 60) {
        ack({ ok: false, error: { code: "RATE_LIMITED", message: "A little too fast. Please wait a moment and try again." } });
        return;
      }
      enqueue(async () => {
        const actor = socket.data.actor;
        try {
          const parsed = schema.safeParse(command);
          if (!parsed.success) throw new TaskHoldemError("INVALID_INPUT", "Please check the submitted fields and try again.");
          const data = await operation(parsed.data);
          ack({ ok: true, data });
        } catch (error) {
          if (error instanceof TaskHoldemError) {
            if (error.code === "NOT_JOINED" && actor) await releaseActor(socket, actor);
            ack({ ok: false, error: { code: error.code, message: error.message } });
          } else {
            logger.error(`[TaskHoldem] Command failed: ${error instanceof Error ? error.message : "Unexpected error"}`);
            ack({ ok: false, error: { code: "UNAVAILABLE", message: "The room could not be updated. Please try again shortly." } });
          }
        }
      });
    }

    async function join(command: z.output<typeof taskHoldemJoinSchema>, create: boolean): Promise<TaskHoldemSnapshot> {
      if (socket.data.actor && socket.data.actor.roomId !== command.roomId) {
        throw new TaskHoldemError("INVALID_INPUT", "Leave your current room before joining another one.");
      }
      const update = await (create ? service.createRoom(command, socket.id) : service.joinRoom(command, socket.id));
      const participantId = service.getJoinedParticipant(update, command.token);
      const actor = { roomId: command.roomId, participantId, connectionId: socket.id };
      if (socket.data.actor) await releaseActor(socket, socket.data.actor);
      socket.data.actor = actor;
      try {
        await socket.join([roomChannel(actor.roomId), memberChannel(actor)]);
        const confirmed = await service.syncRoom(actor);
        if (!socket.connected || socket.data.actor !== actor) throw new TaskHoldemError("NOT_JOINED", "Your room admission expired. Please join again.");
        publish({
          ...confirmed,
          changed: update.changed || confirmed.changed,
          removedParticipantIds: [...new Set([...update.removedParticipantIds, ...confirmed.removedParticipantIds])],
        });
        return snapshot(confirmed, actor);
      } catch (error) {
        await releaseActor(socket, actor);
        throw error;
      }
    }

    socket.on("room:inspect", (command, ack) => handle({
      schema: taskHoldemInspectSchema, command, ack,
      operation: value => service.inspectRoom(value.roomId),
    }));
    socket.on("room:create", (command, ack) => handle({ schema: taskHoldemJoinSchema, command, ack, operation: value => join(value, true) }));
    socket.on("room:join", (command, ack) => handle({ schema: taskHoldemJoinSchema, command, ack, operation: value => join(value, false) }));
    socket.on("room:sync", (command, ack) => handle({
      schema: taskHoldemEmptySchema, command, ack,
      operation: async () => {
        const actor = requireActor();
        const update = await service.syncRoom(actor);
        publish(update);
        return snapshot(update, actor);
      },
    }));
    socket.on("room:leave", (command, ack) => handle({
      schema: taskHoldemEmptySchema, command, ack,
      operation: async () => {
        const actor = requireActor();
        const update = await service.leaveRoom(actor);
        await releaseActor(socket, actor);
        publish(update);
        return null;
      },
    }));
    socket.on("round:vote", (command, ack) => handle({
      schema: taskHoldemSelectSchema, command, ack,
      operation: async (value) => {
        const actor = requireActor();
        const update = await service.selectVote(actor, value);
        publish(update);
        return snapshot(update, actor);
      },
    }));
    socket.on("round:reveal", (command, ack) => handle({
      schema: taskHoldemRoundSchema, command, ack,
      operation: async (value) => {
        const actor = requireActor();
        const update = await service.revealRound(actor, value.roundId);
        publish(update);
        return snapshot(update, actor);
      },
    }));
    socket.on("round:restart", (command, ack) => handle({
      schema: taskHoldemRoundSchema, command, ack,
      operation: async (value) => {
        const actor = requireActor();
        const update = await service.restartRound(actor, value.roundId);
        publish(update);
        return snapshot(update, actor);
      },
    }));
    socket.on("round:topic", (command, ack) => handle({
      schema: taskHoldemTopicSchema, command, ack,
      operation: async (value) => {
        const actor = requireActor();
        const update = await service.setTopic(actor, value);
        publish(update);
        return snapshot(update, actor);
      },
    }));
    socket.on("room:history", (command, ack) => handle({
      schema: taskHoldemHistorySchema, command, ack,
      operation: async (value) => {
        const { update, history } = await service.getHistory(requireActor(), value.before);
        publish(update);
        return history;
      },
    }));
    socket.on("chat:send", (command, ack) => handle({
      schema: taskHoldemMessageSchema, command, ack,
      operation: async (value) => {
        const { update, message } = await service.createMessage(requireActor(), value.content);
        publish(update);
        io.to(roomChannel(message.roomId)).emit("chat:message", message);
        return message;
      },
    }));

    socket.on("disconnect", () => enqueue(async () => {
      if (!socket.data.actor) return;
      try {
        publish(await service.disconnect(socket.data.actor));
      } catch (error) {
        reportBackgroundError(error instanceof Error ? error : new Error("Disconnect failed"));
      }
    }));
    socket.on("error", error => logger.error(`[TaskHoldem] Socket error: ${error.message}`));
  });

  async function maintain(): Promise<void> {
    if (stopped || maintaining) return;
    maintaining = true;
    try {
      for (const roomId of await service.findDueRooms(Date.now())) {
        try {
          publish(await service.reconcileRoom(roomId));
        } catch (error) {
          reportBackgroundError(error instanceof Error ? error : new Error("Room reconciliation failed"));
        }
      }
    } catch (error) {
      reportBackgroundError(error instanceof Error ? error : new Error("Room lookup failed"));
    } finally {
      maintaining = false;
    }
  }

  async function heartbeat(): Promise<void> {
    if (stopped || heartbeating) return;
    heartbeating = true;
    try {
      for (const socket of io.sockets.sockets.values()) {
        const actor = socket.data.actor;
        if (!actor) continue;
        try {
          publish(await service.heartbeat(actor));
        } catch (error) {
          if (error instanceof TaskHoldemError && ["NOT_JOINED", "ROOM_NOT_FOUND"].includes(error.code)) await releaseActor(socket, actor);
          reportBackgroundError(error instanceof Error ? error : new Error("Heartbeat failed"));
        }
      }
    } finally {
      heartbeating = false;
    }
  }

  const maintenanceTimer = setInterval(() => { if (!maintaining) maintenanceTask = maintain(); }, taskHoldemConfig.maintenanceMs);
  const heartbeatTimer = setInterval(() => { if (!heartbeating) heartbeatTask = heartbeat(); }, taskHoldemConfig.heartbeatMs);
  maintenanceTimer.unref();
  heartbeatTimer.unref();

  return {
    async close() {
      stopped = true;
      clearInterval(maintenanceTimer);
      clearInterval(heartbeatTimer);
      await io.close();
      await Promise.all([...tasks, maintenanceTask, heartbeatTask]);
    },
  };
}
