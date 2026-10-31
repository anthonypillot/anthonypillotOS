import { createAdapter } from "@socket.io/postgres-adapter";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import pg from "pg";
import { Server } from "socket.io";
import { closeTaskHoldemDatabase } from "../dao/task-holdem.dao";
import { registerTaskHoldemGateway, type TaskHoldemServer } from "../realtime/task-holdem";
import { logger } from "#server/utils/logger";
import { taskHoldemSocketPath } from "../../shared/types/task-holdem.type";

export default defineNitroPlugin((nitro) => {
  const pool = new pg.Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
  pool.on("error", error => logger.error(`[TaskHoldem] PostgreSQL adapter error: ${error.message}`));

  const engine = new Engine({
    maxHttpBufferSize: 16_384,
    allowRequest(request, accept) {
      const origin = request.headers.origin;
      if (!origin) {
        accept(null, true);
        return;
      }
      try {
        accept(null, new URL(origin).host === request.headers.host);
      } catch {
        accept("Invalid origin", false);
      }
    },
  });
  const io: TaskHoldemServer = new Server({ adapter: createAdapter(pool) });
  io.bind(engine);
  const gateway = registerTaskHoldemGateway(io);

  nitro.hooks.hook("close", async () => {
    await gateway.close();
    await closeTaskHoldemDatabase();
    await pool.end();
  });

  nitro.router.use(taskHoldemSocketPath, defineEventHandler({
    handler(event) {
      // @ts-expect-error Engine.IO requires the Node request behind Nitro's WebSocket bridge.
      engine.handleRequest(event.node.req, event.node.res);
      event._handled = true;
    },
    websocket: {
      open(peer) {
        // @ts-expect-error Nitro does not expose this Node request in its public peer type.
        engine.prepare(peer._internal.nodeReq);
        // @ts-expect-error Engine.IO and Nitro's WebSocket bridge use private request fields.
        engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket);
      },
    },
  }));
});
