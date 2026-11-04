import { z } from "zod";
import { taskHoldemVotingScales, taskHoldemVoteValues } from "../data/decks";

export const taskHoldemRoomIdSchema = z.uuid();
export const taskHoldemTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const taskHoldemAvatarSchema = z.enum(["cowboy", "officer", "firefighter", "princess", "doctor", "robot"]);
export const taskHoldemVotingScaleSchema = z.enum(taskHoldemVotingScales.map(scale => scale.value));
export const taskHoldemVoteSchema = z.literal(taskHoldemVoteValues);

export const taskHoldemProfileSchema = z.strictObject({
  name: z.string().trim().min(1).max(40),
  avatar: taskHoldemAvatarSchema,
});

export const taskHoldemJoinSchema = z.strictObject({
  roomId: taskHoldemRoomIdSchema,
  token: taskHoldemTokenSchema,
  profile: taskHoldemProfileSchema,
});

export const taskHoldemCreateSchema = taskHoldemJoinSchema.extend({ votingScale: taskHoldemVotingScaleSchema.default("fibonacci") });

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
