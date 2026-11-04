import { z } from "zod";

const durationSchema = z.coerce.number().int().min(250).max(120_000);

export const taskHoldemConfig = {
  graceMs: durationSchema.parse(process.env.TASK_HOLDEM_GRACE_MS ?? 30_000),
  revealMs: durationSchema.parse(process.env.TASK_HOLDEM_REVEAL_MS ?? 2000),
  leaseMs: 45_000,
  heartbeatMs: 10_000,
  maintenanceMs: 500,
};
