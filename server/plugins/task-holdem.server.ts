import type { User } from "@/components/task-holdem/CreateUser.vue";
import * as dao from "@/server/dao/task-holdem.dao";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/task-holdem.type";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import type { NitroApp } from "nitropack";
import pg from "pg";
import { Server } from "socket.io";

export default defineNitroPlugin((nitro: NitroApp) => {
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  const pool = new pg.Pool({ connectionString });

  pool.on("error", (error) => {
    logger.error(`Socket - Error while connecting to Postgres: ${error}`);
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

    const roomId = socket.handshake.query.roomId as string;
    if (roomId) {
      socket.join(roomId);

      const users: User[] = await getUsers(roomId);
      io.to(roomId).emit("users-update", users);

      socket.on("message", (message) => {
        io.to(roomId).emit("message", message);
      });

      socket.on("users-update", async (users) => {
        const usersUpdated = await dao.updateUsers(roomId, users);
        io.to(roomId).emit("users-update", usersUpdated);
      });

      socket.on("user-create", async (user) => {
        const users: User[] = await getUsers(roomId);
        if (!users.find((u) => u.id === user.id)) {
          users.push(user);
        }
        const usersUpdated = await dao.updateUsers(roomId, users);
        io.to(roomId).emit("users-update", usersUpdated);
      });

      socket.on("user-remove", async (user) => {
        const users: User[] = await getUsers(roomId);
        const usersWithoutDeletedUser = users.filter((u) => u.id !== user.id);
        const usersUpdated = await dao.updateUsers(roomId, usersWithoutDeletedUser);
        io.to(roomId).emit("users-update", usersUpdated);
      });
    }

    socket.on("error", (error) => {
      logger.error(`Socket - Error: ${error}`);
    });

    socket.on("disconnect", async () => {
      io.emit("data", {
        socketNumber: (await io.fetchSockets()).length,
      });
    });
  });

  nitro.router.use(
    "/api/websocket/task-holdem",
    defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          const nodeContext = peer.ctx.node;
          const req = nodeContext.req;

          // @ts-expect-error private method
          engine.prepare(req);

          const rawSocket = nodeContext.req.socket;
          const websocket = nodeContext.ws;

          // @ts-expect-error private method
          engine.onWebSocket(req, rawSocket, websocket);
        },
      },
    })
  );
});

async function getUsers(roomId: string): Promise<User[]> {
  const users = await dao.getUsers(roomId);

  if (users) {
    return users;
  } else {
    return await dao.createRoom(roomId);
  }
}
