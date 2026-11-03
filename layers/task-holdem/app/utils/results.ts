import { taskHoldemDeck, type TaskHoldemVote } from "../../shared/types/room.type";

export type TaskHoldemVoteSummary = {
  total: number;
  numeric: number;
  pass: number;
  unsure: number;
  distribution: { value: TaskHoldemVote; count: number }[];
};

export function getTaskHoldemVoteSummary(votes: readonly TaskHoldemVote[]): TaskHoldemVoteSummary {
  const counts = new Map<TaskHoldemVote, number>();
  for (const value of votes) counts.set(value, (counts.get(value) ?? 0) + 1);
  const pass = counts.get("skip") ?? 0;
  const unsure = counts.get("break") ?? 0;
  return {
    total: votes.length,
    numeric: votes.length - pass - unsure,
    pass,
    unsure,
    distribution: taskHoldemDeck.flatMap(value => counts.has(value) ? [{ value, count: counts.get(value)! }] : []),
  };
}
