import { taskHoldemDeck, type TaskHoldemVote } from "../../shared/types/task-holdem.type";

export type TaskHoldemSuit = "clubs" | "diamonds" | "spades" | "hearts";

const cardSuits: readonly TaskHoldemSuit[] = ["clubs", "diamonds", "spades", "hearts"];

export function getTaskHoldemCardSuit(value: TaskHoldemVote): TaskHoldemSuit {
  return cardSuits[taskHoldemDeck.indexOf(value) % cardSuits.length] ?? "spades";
}

export const taskHoldemCardIcons = {
  skip: "i-heroicons-moon",
  break: "i-heroicons-question-mark-circle",
};

export function formatTaskHoldemVote(value: TaskHoldemVote): string {
  if (value === "skip") return "Pass";
  if (value === "break") return "Unsure";
  return value.toString();
}

export function formatTaskHoldemAverage(value: number | null): string {
  return value === null ? "N/A" : new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
}
