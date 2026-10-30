import { z } from "zod";

export const taskHoldemRoomIdSchema = z.uuid();
export const taskHoldemTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const taskHoldemAvatarSchema = z.enum(["dragon", "slime", "phoenix", "spirit", "golem", "mushroom"]);
export const taskHoldemVoteSchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8), z.literal(13),
  z.literal(21), z.literal(34), z.literal(55), z.literal(89), z.literal("skip"), z.literal("break"),
]);

export const taskHoldemProfileSchema = z.strictObject({
  name: z.string().trim().min(1).max(40),
  avatar: taskHoldemAvatarSchema,
});

export const taskHoldemJoinSchema = z.strictObject({
  roomId: taskHoldemRoomIdSchema,
  token: taskHoldemTokenSchema,
  profile: taskHoldemProfileSchema,
});

export const taskHoldemInspectSchema = z.strictObject({ roomId: taskHoldemRoomIdSchema });
export const taskHoldemEmptySchema = z.strictObject({});
export const taskHoldemRoundSchema = z.strictObject({ roundId: z.uuid() });
export const taskHoldemSelectSchema = taskHoldemRoundSchema.extend({ value: taskHoldemVoteSchema.nullable() });
export const taskHoldemTopicSchema = taskHoldemRoundSchema.extend({
  topic: z.string().trim().max(160),
  previousTopic: z.string().max(160).nullable(),
});
export const taskHoldemHistorySchema = z.strictObject({ before: z.number().int().positive().optional() });
export const taskHoldemMessageSchema = z.strictObject({ content: z.string().trim().min(1).max(2000) });
