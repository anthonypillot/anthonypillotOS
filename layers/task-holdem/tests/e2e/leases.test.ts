import { randomBytes } from "node:crypto";
import pg from "pg";
import { baseURL, databaseURL } from "../../../../tests/e2e/configuration";
import { expect, test } from "./support/task-holdem";
import { connectTaskHoldemSocket, taskHoldemSuccess } from "./support/task-holdem-socket";
import type { TaskHoldemJoin } from "../../shared/types/task-holdem.type";

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Connection persistence is covered once against PostgreSQL.");

test("rejoining on the same transport replaces an expired connection's participant binding", async ({ roomId, createPlayer }) => {
  await createPlayer(roomId, "Observer");
  const socket = await connectTaskHoldemSocket(baseURL);
  const pool = new pg.Pool({ connectionString: databaseURL });
  const lock = await pool.connect();
  try {
    const command = { roomId, token: randomBytes(32).toString("hex"), profile: { name: "Alice", avatar: "cowboy" } } satisfies TaskHoldemJoin;
    const initial = taskHoldemSuccess(await socket.emitWithAck("room:join", command));
    await lock.query("BEGIN");
    await lock.query("SELECT id FROM task_holdem_room WHERE id = $1 FOR UPDATE", [roomId]);
    await lock.query("UPDATE task_holdem_connection SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1", [socket.id]);
    const owner = await lock.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
    const rejoining = socket.emitWithAck("room:join", command);
    await expect.poll(async () => {
      const waiting = await pool.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))", [owner.rows[0]!.pid]);
      return waiting.rows[0]!.count;
    }).toBeGreaterThan(0);
    await lock.query("COMMIT");
    const fresh = taskHoldemSuccess(await rejoining);
    expect(fresh.self.participantId).not.toBe(initial.self.participantId);
    const binding = await pool.query<{ participant_id: string }>("SELECT participant_id FROM task_holdem_connection WHERE id = $1", [socket.id]);
    expect(binding.rows[0]?.participant_id).toBe(fresh.self.participantId);
    expect(taskHoldemSuccess(await socket.emitWithAck("room:sync", {})).self.participantId).toBe(fresh.self.participantId);
    expect(taskHoldemSuccess(await socket.emitWithAck("round:vote", { roundId: fresh.room.round.id, value: 8 })).self.vote).toBe(8);
  } finally {
    await lock.query("ROLLBACK");
    lock.release();
    socket.disconnect();
    await pool.end();
  }
});
