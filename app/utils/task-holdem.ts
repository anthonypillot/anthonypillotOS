import type { TaskHoldemVote } from "#shared/types/task-holdem.type";

export const taskHoldemCardIcons = {
  skip: "i-heroicons-moon",
  break: "i-heroicons-question-mark-circle",
};

export function formatTaskHoldemVote(value: TaskHoldemVote): string {
  if (value === "skip") return "Pass";
  if (value === "break") return "Unsure";
  return value.toString();
}
