import type { User } from "@/components/task-holdem/CreateUser.vue";
import * as service from "#server/services/task-holdem.service";
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
      const user: User | null = await service.getUserBySessionId(roomId, sessionId);
      if (user && user.name) {
        logger.debug(`${prefixLog} User reconnected: [${user.name}]`);
      }
    }

    if (roomId) {
      socket.join(roomId);

      io.to(roomId).emit("room-update", await service.getOrCreateRoom(roomId));

      socket.on("message", (message) => {
        io.to(roomId).emit("message", message);
      });

      socket.on("room-update", async (room) => {
        io.to(roomId).emit("room-update", await service.updateRoom(roomId, room));
      });

      socket.on("user-create", async (userToCreate: User) => {
        io.to(roomId).emit("room-update", await service.createUser(roomId, sessionId, userToCreate));
      });

      socket.on("user-remove", async (userToRemove: User) => {
        io.to(roomId).emit("room-update", await service.removeUser(roomId, userToRemove));
      });

      socket.on("room-restart", async (room: Room) => {
        io.to(roomId).emit("room-restart", await service.restartRoom(roomId, room));
      });
    }

    socket.on("disconnect", async () => {
      if (roomId && sessionId) {
        const room: Room | null = await service.removeUserBySessionId(roomId, sessionId);
        if (room) {
          io.to(roomId).emit("room-update", room);
        }
      }

      io.emit("data", {
        socketNumber: (await io.fetchSockets()).length,
      });
    });

    socket.on("error", (error) => {
      logger.error(`${prefixLog} Error: ${error}`);
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
