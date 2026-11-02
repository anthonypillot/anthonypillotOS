import type { TaskHoldemMascotPose } from "./mascot-poses";

export type TaskHoldemMascotMotion = "blink" | "glance" | "signature" | "mischief" | "vote" | "reveal" | "think" | "break" | "moonwalk";
export type TaskHoldemMascotMotionKind = "ambient" | "passive" | "reaction" | "secret";
type Frame = { pose: TaskHoldemMascotPose; duration: number };
type Performance = { owner: symbol; priority: number; stop: () => void };

export const taskHoldemMascotMotions: Record<TaskHoldemMascotMotion, Frame[]> = {
  blink: [{ pose: "blink", duration: 140 }, { pose: "rest", duration: 100 }],
  glance: [{ pose: "look-left", duration: 320 }, { pose: "rest", duration: 180 }, { pose: "look-right", duration: 320 }, { pose: "rest", duration: 140 }],
  signature: [{ pose: "gesture", duration: 240 }, { pose: "flourish", duration: 320 }, { pose: "gesture", duration: 240 }, { pose: "rest", duration: 180 }],
  mischief: [{ pose: "ponder", duration: 220 }, { pose: "mischief", duration: 700 }, { pose: "flourish", duration: 300 }, { pose: "rest", duration: 180 }],
  vote: [{ pose: "nod", duration: 180 }, { pose: "gesture", duration: 320 }, { pose: "rest", duration: 180 }],
  reveal: [{ pose: "gesture", duration: 200 }, { pose: "flourish", duration: 260 }, { pose: "gesture", duration: 200 }, { pose: "flourish", duration: 260 }, { pose: "rest", duration: 160 }],
  think: [{ pose: "look-left", duration: 240 }, { pose: "ponder", duration: 380 }, { pose: "shrug", duration: 600 }, { pose: "rest", duration: 180 }],
  break: [{ pose: "ponder", duration: 180 }, { pose: "sip", duration: 1000 }, { pose: "rest", duration: 180 }],
  moonwalk: Array.from({ length: 10 }, (_, index) => ({ pose: index % 2 ? "step-right" : "step-left", duration: 180 })),
};

export function pickTaskHoldemMascotMotion(previous?: TaskHoldemMascotMotion, random = Math.random): TaskHoldemMascotMotion {
  const choices = (["glance", "signature", "mischief"] satisfies TaskHoldemMascotMotion[]).filter(motion => motion !== previous);
  return choices[Math.floor(random() * choices.length)] ?? "signature";
}

export function createTaskHoldemMascotStage() {
  let current: Performance | undefined;
  const interactions = new Map<symbol, () => void>();
  let quietUntil = 0;
  let secretAfter = 0;

  function claim(owner: symbol, stop: () => void, kind: TaskHoldemMascotMotionKind): boolean {
    if (kind === "reaction" || kind === "passive") {
      const previous = current;
      current = undefined;
      previous?.stop();
      interactions.get(owner)?.();
      interactions.set(owner, stop);
      return true;
    }
    const now = Date.now();
    const priority = { ambient: 1, secret: 2 }[kind];
    if (interactions.size) return false;
    if ((kind === "ambient" && now < quietUntil) || (kind === "secret" && now < secretAfter)) return false;
    if (current && current.owner !== owner && current.priority >= priority) return false;
    current?.stop();
    current = { owner, priority, stop };
    if (kind === "secret") secretAfter = now + 60_000;
    return true;
  }

  function release(owner: symbol): void {
    const interaction = interactions.delete(owner);
    if (current?.owner === owner) {
      current = undefined;
      quietUntil = Date.now() + 2000;
    } else if (interaction) quietUntil = Date.now() + 2000;
  }

  return { claim, release };
}
