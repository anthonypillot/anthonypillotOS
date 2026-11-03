import { describe, expect, test, vi } from "vitest";
import { taskHoldemDeck, type TaskHoldemHistoryEntry, type TaskHoldemHistoryPage } from "../../../shared/types/room.type";
import { getTaskHoldemDeck, taskHoldemVotingScales } from "../../../shared/data/decks";
import { formatTaskHoldemReportCsv, formatTaskHoldemReportText, loadTaskHoldemReport } from "../../../app/utils/report";

function entry(number: number, topic: string | null = `Task ${number}`): TaskHoldemHistoryEntry {
  return {
    id: `round-${number}`, number, topic, startedAt: 1000, revealedAt: 3000, average: 8,
    ballots: [8, "skip", "break"].map((value, index) => ({ participantId: `private-${index}`, profile: { name: "Private voter", avatar: "robot" }, value: value === "skip" ? "skip" : value === "break" ? "break" : 8 })),
  };
}

describe("Task Hold'em complete report loading", () => {
  test("loads every page through the captured round, in chronological order", async () => {
    const load = vi.fn<(before?: number) => Promise<TaskHoldemHistoryPage | undefined>>()
      .mockResolvedValueOnce({ items: [entry(3), entry(2)], nextBefore: 2 })
      .mockResolvedValueOnce({ items: [entry(1)], nextBefore: null });
    expect((await loadTaskHoldemReport(load, 3, new AbortController().signal)).map(item => item.number)).toEqual([1, 2, 3]);
    expect(load.mock.calls).toEqual([[4], [2]]);
  });

  test("rejects missing pages, incomplete history, duplicate rows and stuck cursors", async () => {
    const signal = new AbortController().signal;
    await expect(loadTaskHoldemReport(async () => undefined, 2, signal)).rejects.toThrow("could not be loaded");
    await expect(loadTaskHoldemReport(async () => ({ items: [entry(2)], nextBefore: null }), 2, signal)).rejects.toThrow("incomplete");
    await expect(loadTaskHoldemReport(async () => ({ items: [entry(2), entry(2)], nextBefore: null }), 2, signal)).rejects.toThrow("inconsistent");
    await expect(loadTaskHoldemReport(async () => ({ items: [entry(2)], nextBefore: 3 }), 2, signal)).rejects.toThrow("did not advance");
  });

  test("captures the upper cursor and stops immediately when cancelled", async () => {
    const controller = new AbortController();
    const load = vi.fn(async () => { controller.abort(); return { items: [entry(1)], nextBefore: null }; });
    await expect(loadTaskHoldemReport(load, 1, controller.signal)).rejects.toThrow();
    expect(load).toHaveBeenCalledExactlyOnceWith(2);
    await expect(loadTaskHoldemReport(load, 1, controller.signal)).rejects.toThrow();
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("Task Hold'em anonymous room summaries", () => {
  test("includes UTC dates and descriptive results without participant identities", () => {
    const entries = [entry(1), { ...entry(2, null), ballots: [], average: null }];
    const text = formatTaskHoldemReportText(entries, taskHoldemDeck);
    expect(text).toContain("Round 1 — Task 1");
    expect(text).toContain("1970-01-01T00:00:01.000Z");
    expect(text).toContain("Votes: 3 total · 1 numeric · 1 Pass · 1 Unsure");
    expect(text).toContain("Distribution: 8 × 1 · Pass × 1 · Unsure × 1");
    expect(text).toContain("Round 2 — Untitled round");
    expect(text).toContain("Average: N/A");
    for (const output of [text, formatTaskHoldemReportCsv(entries, taskHoldemDeck)]) {
      expect(output).not.toContain("Private voter");
      expect(output).not.toContain("private-");
    }
  });

  test.each(["=HYPERLINK(\"https://example.com\")", "+SUM(1,2)", "-1+2", "@SUM(1,2)", "  =1+2", "\tformula"])("protects spreadsheet cells starting with %j", (topic) => {
    const csv = formatTaskHoldemReportCsv([entry(1, topic)], taskHoldemDeck);
    expect(csv).toContain(`"'${topic.replace(/"/g, '""')}"`);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  test("quotes commas, newlines and quotes without changing ordinary titles", () => {
    const csv = formatTaskHoldemReportCsv([entry(1, 'A, "quoted"\nsubject')], taskHoldemDeck);
    expect(csv).toContain('"A, ""quoted""\nsubject"');
    expect(csv).toContain('"Votes for 89"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  test.each(taskHoldemVotingScales)("exports every $label card without Fibonacci-only columns", (scale) => {
    const deck = getTaskHoldemDeck(scale.value);
    const votes = scale.cards;
    const entries: TaskHoldemHistoryEntry[] = [{
      ...entry(1),
      ballots: votes.map((value, index) => ({ participantId: `private-${index}`, profile: { name: "Private voter", avatar: "robot" }, value })),
    }];
    const text = formatTaskHoldemReportText(entries, deck);
    const csv = formatTaskHoldemReportCsv(entries, deck);
    expect(text).toContain(`Voting scale: ${scale.label}`);
    expect(csv).toContain(`"${scale.label}"`);
    for (const value of deck.filter(card => typeof card === "number")) {
      expect(text).toContain(`${value} × 1`);
      expect(csv).toContain(`"Votes for ${value}"`);
    }
    const rows = csv.trim().split("\r\n");
    expect(rows[0]?.match(/"(?:[^"]|"")*"/g)).toHaveLength(10 + deck.length - 2);
    expect(rows[1]?.match(/"(?:[^"]|"")*"/g)).toHaveLength(10 + deck.length - 2);
    expect(rows[1]?.endsWith(deck.filter(card => typeof card === "number").map(() => ',"1"').join(""))).toBe(true);
    if (scale.value !== "fibonacci") expect(csv).not.toContain('"Votes for 89"');
    expect(text).not.toContain("Private voter");
    expect(csv).not.toContain("private-");
  });

  test("refuses inconsistent history instead of silently dropping votes outside the selected deck", () => {
    const entries = [{ ...entry(1), ballots: [{ participantId: "private", profile: { name: "Private voter", avatar: "robot" }, value: 13 }] }] satisfies TaskHoldemHistoryEntry[];
    const deck = getTaskHoldemDeck("linear");
    expect(() => formatTaskHoldemReportText(entries, deck)).toThrow("does not match");
    expect(() => formatTaskHoldemReportCsv(entries, deck)).toThrow("does not match");
  });
});
