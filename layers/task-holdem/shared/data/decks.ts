export const taskHoldemVotingScales = [
  { value: "fibonacci", label: "Fibonacci", cards: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "skip", "break"] },
  { value: "linear", label: "Linear (1–10)", cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "skip", "break"] },
  { value: "powers-of-two", label: "Powers of 2", cards: [1, 2, 4, 8, 16, 32, 64, "skip", "break"] },
] as const;

export type TaskHoldemVotingScale = typeof taskHoldemVotingScales[number]["value"];
type TaskHoldemDeckCard = typeof taskHoldemVotingScales[number]["cards"][number];

export const taskHoldemVoteValues = [...new Set(taskHoldemVotingScales.flatMap<TaskHoldemDeckCard>(scale => scale.cards))];

export function getTaskHoldemDeck(value: TaskHoldemVotingScale): TaskHoldemDeckCard[] {
  const scale = taskHoldemVotingScales.find(scale => scale.value === value);
  if (!scale) throw new Error("Unsupported voting scale.");
  return [...scale.cards];
}

export function getTaskHoldemVotingScale(deck: readonly TaskHoldemDeckCard[]) {
  return taskHoldemVotingScales.find(scale => scale.cards.length === deck.length && scale.cards.every((value, index) => value === deck[index]));
}
