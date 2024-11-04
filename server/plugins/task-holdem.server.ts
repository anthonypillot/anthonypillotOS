import * as dao from "@/server/dao/task-holdem.dao";
import type { ClientToServerEvents, Room, ServerToClientEvents } from "@/types/task-holdem.type";
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

    const roomId = socket.handshake.query.id as string;

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
          logger.debug(`Socket - User create: ${userToCreate.name}`);
          room.users.push(userToCreate);
        }
        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room", updatedRoom);
      });

      socket.on("user-remove", async (userToRemove) => {
        logger.debug(`Socket - User remove: ${userToRemove.name}`);

        const room: Room = await dao.createOrUpdateRoom(roomId);
        room.users = room.users.filter((user) => user.id !== userToRemove.id);

        const updatedRoom = await dao.updateRoom(roomId, room);
        io.to(roomId).emit("room", updatedRoom);
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
