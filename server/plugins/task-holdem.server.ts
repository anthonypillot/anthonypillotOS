import type { User } from "@/components/task-holdem/CreateUser.vue";
import * as dao from "@/server/dao/task-holdem.dao";
import type { ClientToServerEvents, Room, ServerToClientEvents } from "@/types/task-holdem.type";
import { prefixLog } from "@/types/task-holdem.type";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import pg from "pg";
import { Server } from "socket.io";

export default defineNitroPlugin((nitro) => {
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  const pool = new pg.Pool({ connectionString });

  pool.on("error", (error) => {
    logger.error(`${prefixLog} Error while connecting to Postgres: ${error}`);
  });

  const engine = new Engine();
  const io = new Server<ClientToServerEvents, ServerToClientEvents>({
    adapter: createAdapter(pool),
  });

  io.bind(engine);

  io.on("connection", async (socket) => {
    io.emit("data", {
      socketNumber: (await io.fetchSockets()).length,
    });

    const roomId = socket.handshake.query.id as string;
    const sessionId = socket.handshake.query.sessionId as string;

    if (sessionId) {
      const user: User | null = await dao.getUserBySessionId(roomId, sessionId);
      if (user && user.name) {
        logger.debug(`${prefixLog} User reconnected: [${user.name}]`);
      }
    }

    if (roomId) {
      socket.join(roomId);

      const room: Room = await dao.getOrCreateRoom(roomId);
      io.to(roomId).emit("room-update", room);

      socket.on("message", (message) => {
        io.to(roomId).emit("message", message);
      });

      socket.on("room-update", async (room) => {
        const updatedRoom: Room = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room-update", updatedRoom);
      });

      socket.on("user-create", async (userToCreate: User) => {
        const room: Room = await dao.getOrCreateRoom(roomId);
        if (!room.users.find((user) => user.id === userToCreate.id)) {
          logger.debug(`${prefixLog} User to create: [${userToCreate.name}]`);
          userToCreate.sessionId = sessionId;
          room.users.push(userToCreate);
        }
        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room-update", updatedRoom);
      });

      socket.on("user-remove", async (userToRemove: User) => {
        const room: Room = await dao.getOrCreateRoom(roomId);
        room.users = room.users.filter((user) => user.id !== userToRemove.id);

        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room-update", updatedRoom);

        logger.debug(`${prefixLog} User removed: [${userToRemove.name}]`);
      });

      socket.on("room-restart", async (room: Room) => {
        room.game.status = "playing";
        room.users.forEach((user) => {
          user.selectedCard = null;
        });

        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room-restart", updatedRoom);
      });
    }

    socket.on("error", (error) => {
      logger.error(`${prefixLog} Error: ${error}`);
    });

    socket.on("disconnect", async () => {
      const roomId = socket.handshake.query.id as string;
      const sessionId = socket.handshake.query.sessionId as string;

      if (roomId && sessionId) {
        const room: Room | null = await dao.getRoom(roomId);
        if (room) {
          const userToRemove = room.users.find((user) => user.sessionId === sessionId);

          if (userToRemove) {
            room.users = room.users.filter((user) => {
              return user.sessionId !== sessionId;
            });

            logger.debug(`${prefixLog} User disconnected: [${userToRemove.name}]`);

            const updatedRoom = await dao.updateRoom(roomId, room);
            io.to(roomId).emit("room-update", updatedRoom);
          }
        }
      }

      io.emit("data", {
        socketNumber: (await io.fetchSockets()).length,
      });
    });
  });

  nitro.router.use(
    "/api/websocket/task-holdem",
    defineEventHandler({
      handler(event) {
        // @ts-expect-error private method and property
        engine.handleRequest(event.node.req, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          // @ts-expect-error private method and property
          engine.prepare(peer._internal.nodeReq);
          // @ts-expect-error private method and property
          engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket);
        },
      },
    })
  );
});
