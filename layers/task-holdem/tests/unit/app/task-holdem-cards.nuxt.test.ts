import { describe, expect, test } from "vitest";
import { taskHoldemDeck } from "../../../shared/types/task-holdem.type";
import { getTaskHoldemCardSuit } from "../../../app/utils/task-holdem";

describe("Task Hold'em decorative suits", () => {
  test("covers all four traditional suits without changing the estimation deck", () => {
    expect(new Set(taskHoldemDeck.map(getTaskHoldemCardSuit))).toEqual(new Set(["clubs", "diamonds", "spades", "hearts"]));
    expect(taskHoldemDeck).toEqual([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "skip", "break"]);
  });

  test.each([
    [1, "clubs"], [2, "diamonds"], [3, "spades"], [5, "hearts"], ["skip", "spades"], ["break", "hearts"],
  ] as const)("assigns %s the %s suit", (value, suit) => {
    expect(getTaskHoldemCardSuit(value)).toBe(suit);
  });
});
