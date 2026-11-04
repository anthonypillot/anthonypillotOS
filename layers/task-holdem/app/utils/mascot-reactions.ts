import type { TaskHoldemRoom, TaskHoldemSelf, TaskHoldemVote } from "../../shared/types/room.type";
import type { TaskHoldemMascotMotion, TaskHoldemMascotMotionKind } from "./mascot-motion";

export type TaskHoldemMascotReaction = { motion: TaskHoldemMascotMotion; kind: TaskHoldemMascotMotionKind };
export type TaskHoldemMascotView = { room: TaskHoldemRoom | null; self: TaskHoldemSelf | null; active: boolean };

function voteMotion(vote: TaskHoldemVote | null): TaskHoldemMascotMotion {
  // The legacy protocol calls the Unsure card "break" and the Pass card "skip".
  if (vote === "break") return "think";
  if (vote === "skip") return "break";
  return vote === null ? "glance" : "vote";
}

export function getTaskHoldemMascotReactions(previous: TaskHoldemMascotView, next: TaskHoldemMascotView): Map<string, TaskHoldemMascotMotion> {
  const reactions = new Map<string, TaskHoldemMascotMotion>();
  const before = previous.room;
  const after = next.room;
  const self = next.self;
  const previousSelf = previous.self;
  if (!previous.active || !next.active || !before || !after || !self || !previousSelf) return reactions;
  if (before.id !== after.id || self.roomId !== after.id || previousSelf.participantId !== self.participantId || after.revision < before.revision || self.revision < previousSelf.revision) return reactions;

  if (before.round.id !== after.round.id || (before.round.phase !== after.round.phase && after.round.phase === "revealed")) {
    const motion = after.round.phase === "voting" ? "signature" : after.round.phase === "revealed" ? "reveal" : null;
    if (motion) for (const participant of after.participants) if (participant.connected) reactions.set(participant.id, motion);
    return reactions;
  }
  if (after.round.phase !== "voting") return reactions;

  const participants = new Map(before.participants.map(participant => [participant.id, participant]));
  for (const participant of after.participants) {
    const old = participants.get(participant.id);
    if (!participant.connected || !old?.connected) continue;
    if (participant.id === self.participantId) {
      if (self.roundId === after.round.id && previousSelf.roundId === self.roundId && previousSelf.vote !== self.vote) reactions.set(participant.id, voteMotion(self.vote));
    } else if (old.hasVoted !== participant.hasVoted) {
      reactions.set(participant.id, participant.hasVoted ? "vote" : "glance");
    }
  }
  return reactions;
}
