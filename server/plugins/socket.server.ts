import { ClientToServerEvents, ServerToClientEvents } from "@/types/socket.type";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import type { NitroApp } from "nitropack";
import pg from "pg";
import { Server } from "socket.io";

export default defineNitroPlugin((nitro: NitroApp) => {
  const connectionString = `${process.env.POSTGRES_PRISMA_URL}`;
  const pool = new pg.Pool({ connectionString });

  pool.on("connect", () => {
    logger.debug("Socket - Connected to Postgres");
  });

  pool.on("error", (error) => {
    logger.error(`Socket - Error: ${error}`);
  });

  const engine = new Engine();
  const io = new Server<ClientToServerEvents, ServerToClientEvents>({
    adapter: createAdapter(pool),
  });

  io.bind(engine);

  io.on("connection", async (socket) => {
    logger.debug(`Socket - User connected: [${socket.id}]`);

    io.emit("data", {
      socketNumber: (await io.fetchSockets()).length,
    });

    socket.on("message", async (message) => {
      io.emit("message", message);
    });

    socket.on("error", (error) => {
      logger.error(`Socket - Error: ${error}`);
    });

    socket.on("disconnect", async () => {
      logger.debug(`Socket - User disconnected: [${socket.id}]`);
      io.emit("data", {
        socketNumber: (await io.fetchSockets()).length,
      });
    });
  });

  nitro.router.use(
    "/api/websocket/",
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
