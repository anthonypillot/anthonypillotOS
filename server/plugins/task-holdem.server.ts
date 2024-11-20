import type { User } from "@/components/task-holdem/CreateUser.vue";
import * as dao from "@/server/dao/task-holdem.dao";
import type { ClientToServerEvents, Room, ServerToClientEvents } from "@/types/task-holdem.type";
import { application } from "@/types/task-holdem.type";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import pg from "pg";
import { Server } from "socket.io";

const prefixLog = `[WEBSOCKET - ${application.name}]`;

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
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      const user: User | null = await dao.getUser(roomId, userId);
      if (user && user.name) {
        logger.debug(`${prefixLog} User reconnected: [${user.name}]`);
      }
    }

    if (roomId) {
      socket.join(roomId);

      const room: Room = await dao.createOrUpdateRoom(roomId);
      io.to(roomId).emit("room", room);

      socket.on("message", (message) => {
        io.to(roomId).emit("message", message);
      });

      socket.on("room", async (room) => {
        const updatedRoom: Room = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room", updatedRoom);
      });

      socket.on("user-create", async (userToCreate) => {
        const room: Room = await dao.createOrUpdateRoom(roomId);
        if (!room.users.find((user) => user.id === userToCreate.id)) {
          logger.debug(`${prefixLog} User to create: [${userToCreate.name}]`);
          room.users.push(userToCreate);
        }
        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room", updatedRoom);
      });

      socket.on("user-remove", async (userToRemove) => {
        const room: Room = await dao.createOrUpdateRoom(roomId);
        room.users = room.users.filter((user) => user.id !== userToRemove.id);

        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room", updatedRoom);

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
      const userId = socket.handshake.query.userId as string;

      if (roomId && userId) {
        const room: Room = await dao.createOrUpdateRoom(roomId);
        room.users = room.users.filter((user) => {
          return user.id !== userId;
        });

        logger.debug(`${prefixLog} User disconnected: [${(await dao.getUser(roomId, userId))?.name}]`);

        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room", updatedRoom);
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
