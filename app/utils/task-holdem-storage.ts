import { taskHoldemProfileSchema, taskHoldemTokenSchema } from "#shared/schemas/task-holdem.schema";
import type { TaskHoldemProfile } from "#shared/types/task-holdem.type";

const profileKey = "task-holdem:v3:profile";
const roomKey = (roomId: string) => `task-holdem:v3:room:${roomId}`;

export function readTaskHoldemProfile(): TaskHoldemProfile {
  try {
    const stored = localStorage.getItem(profileKey);
    const parsed = taskHoldemProfileSchema.safeParse(stored ? JSON.parse(stored) : null);
    if (parsed.success) return parsed.data;
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return { name: "", avatar: "dragon" };
}

export function saveTaskHoldemProfile(profile: TaskHoldemProfile): void {
  try {
    localStorage.setItem(profileKey, JSON.stringify(profile));
  } catch {
    // Remembering a profile is optional; joining must still work without storage.
  }
}

export function readTaskHoldemToken(roomId: string): string | null {
  try {
    const parsed = taskHoldemTokenSchema.safeParse(localStorage.getItem(roomKey(roomId)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveTaskHoldemToken(roomId: string, token: string | null): void {
  try {
    if (token) localStorage.setItem(roomKey(roomId), token);
    else localStorage.removeItem(roomKey(roomId));
  } catch {
    // The active connection can keep using its in-memory credential.
  }
}

export function createTaskHoldemToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
}
