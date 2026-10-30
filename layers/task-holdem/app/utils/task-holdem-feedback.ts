import { z } from "zod";
import type { TaskHoldemRoom } from "../../shared/types/task-holdem.type";

export const taskHoldemFeedbackSchema = z.object({
  muted: z.boolean(),
});

export type TaskHoldemFeedbackPreferences = z.infer<typeof taskHoldemFeedbackSchema>;
export type TaskHoldemCue =
  | "vote" | "vote-clear" | "vote-received" | "message-sent" | "message-received"
  | "joined" | "left" | "reveal-start" | "reveal-end" | "round-start" | "topic" | "success" | "error";

type SoundNote = { frequency: number; delay: number; duration: number };
type Sound = { notes: SoundNote[] };

export const taskHoldemSounds = {
  vote: { notes: [{ frequency: 660, delay: 0, duration: 0.09 }, { frequency: 880, delay: 0.05, duration: 0.1 }] },
  "vote-clear": { notes: [{ frequency: 440, delay: 0, duration: 0.09 }] },
  "vote-received": { notes: [{ frequency: 740, delay: 0, duration: 0.07 }] },
  "message-sent": { notes: [{ frequency: 520, delay: 0, duration: 0.08 }, { frequency: 780, delay: 0.06, duration: 0.1 }] },
  "message-received": { notes: [{ frequency: 880, delay: 0, duration: 0.1 }, { frequency: 660, delay: 0.08, duration: 0.13 }] },
  joined: { notes: [{ frequency: 440, delay: 0, duration: 0.1 }, { frequency: 554, delay: 0.08, duration: 0.12 }] },
  left: { notes: [{ frequency: 554, delay: 0, duration: 0.1 }, { frequency: 440, delay: 0.08, duration: 0.12 }] },
  "reveal-start": { notes: [{ frequency: 392, delay: 0, duration: 0.14 }, { frequency: 494, delay: 0.14, duration: 0.14 }, { frequency: 587, delay: 0.28, duration: 0.16 }] },
  "reveal-end": { notes: [{ frequency: 523, delay: 0, duration: 0.22 }, { frequency: 659, delay: 0.06, duration: 0.22 }, { frequency: 784, delay: 0.12, duration: 0.3 }] },
  "round-start": { notes: [{ frequency: 659, delay: 0, duration: 0.12 }, { frequency: 784, delay: 0.11, duration: 0.12 }, { frequency: 1047, delay: 0.22, duration: 0.24 }] },
  topic: { notes: [{ frequency: 587, delay: 0, duration: 0.1 }, { frequency: 740, delay: 0.06, duration: 0.12 }] },
  success: { notes: [{ frequency: 784, delay: 0, duration: 0.1 }] },
  error: { notes: [{ frequency: 294, delay: 0, duration: 0.14 }, { frequency: 262, delay: 0.12, duration: 0.14 }] },
} satisfies Record<TaskHoldemCue, Sound>;

const preferencesKey = "task-holdem:feedback:v1";

export function readTaskHoldemFeedback(): TaskHoldemFeedbackPreferences {
  try {
    const parsed = taskHoldemFeedbackSchema.safeParse(JSON.parse(localStorage.getItem(preferencesKey) ?? "null"));
    if (parsed.success) return parsed.data;
  } catch {
    // Preferences are optional in restricted browser contexts.
  }
  return { muted: false };
}

export function saveTaskHoldemFeedback(preferences: TaskHoldemFeedbackPreferences): void {
  try {
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  } catch {
    // The sound toggle must still work without persistent storage.
  }
}

export function getTaskHoldemRoomCues(previous: TaskHoldemRoom, next: TaskHoldemRoom, participantId: string): TaskHoldemCue[] {
  if (previous.id !== next.id || next.revision <= previous.revision) return [];
  if (previous.round.id !== next.round.id) return ["round-start"];
  const cues: TaskHoldemCue[] = [];
  if (previous.round.phase !== next.round.phase) {
    if (next.round.phase === "revealing") cues.push("reveal-start");
    if (next.round.phase === "revealed") cues.push("reveal-end");
  }
  if (previous.round.topic !== next.round.topic) cues.push("topic");
  if (next.participants.some(member => !previous.participants.some(old => old.id === member.id))) cues.push("joined");
  if (previous.participants.some(member => !next.participants.some(current => current.id === member.id))) cues.push("left");
  if (next.round.phase === "voting" && next.participants.some(member => member.id !== participantId && member.hasVoted && previous.participants.some(old => old.id === member.id && !old.hasVoted))) {
    cues.push("vote-received");
  }
  return cues;
}
