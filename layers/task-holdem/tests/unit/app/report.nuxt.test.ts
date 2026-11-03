import { describe, expect, test, vi } from "vitest";
import { taskHoldemDeck, type TaskHoldemHistoryEntry, type TaskHoldemHistoryPage } from "../../../shared/types/room.type";
import { getTaskHoldemDeck, taskHoldemVotingScales } from "../../../shared/data/decks";
import { formatTaskHoldemReportCsv, formatTaskHoldemReportText, loadTaskHoldemReport } from "../../../app/utils/report";

function entry(number: number, topic: string | null = `Task ${number}`): TaskHoldemHistoryEntry {
  return {
    id: `round-${number}`, number, topic, startedAt: 1000, revealedAt: 3000, average: 8,
    ballots: ["Alice", "Bob", "Chloé"].map((name, index) => ({ participantId: `private-${index}`, profile: { name, avatar: "robot" }, value: index === 0 ? 8 : index === 1 ? "skip" : "break" })),
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

describe("Task Hold'em room summaries", () => {
  test("includes UTC dates, descriptive results and participant votes without internal identifiers or voting scale labels", () => {
    const entries = [entry(1), { ...entry(2, null), ballots: [], average: null }];
    const text = formatTaskHoldemReportText(entries, taskHoldemDeck);
    expect(text).toContain("Round 1 — Task 1");
    expect(text).toContain("1970-01-01T00:00:01.000Z");
    expect(text).toContain("Votes: 3 total · 1 numeric · 1 Pass · 1 Unsure");
    expect(text).toContain("Distribution: 8 × 1 · Pass × 1 · Unsure × 1");
    expect(text).toContain("Participant votes:\n- Alice: 8\n- Bob: Pass\n- Chloé: Unsure");
    expect(text).toContain("Round 2 — Untitled round");
    expect(text).toContain("Average: N/A");
    expect(text).toContain("Participant votes:\nNo votes");
    const csv = formatTaskHoldemReportCsv(entries, taskHoldemDeck);
    expect(csv).toContain('"Participant votes"');
    expect(csv).toContain('"Alice: 8\nBob: Pass\nChloé: Unsure"');
    expect(csv).toContain('"No votes"');
    for (const output of [text, csv]) {
      expect(output).not.toContain("private-");
      expect(output).not.toContain("round-");
      expect(output).not.toContain("robot");
      expect(output).not.toContain("Voting scale");
      expect(output).not.toContain("Fibonacci");
    }
  });

  test("keeps each archived name and ballot, including participants with identical names", () => {
    const first = entry(1);
    first.ballots[1]!.profile.name = "Alice";
    const second = entry(2);
    second.ballots[0]!.profile.name = "Alicia";
    const text = formatTaskHoldemReportText([first, second], taskHoldemDeck);
    const csv = formatTaskHoldemReportCsv([first, second], taskHoldemDeck);
    expect(text).toContain("Participant votes:\n- Alice: 8\n- Alice: Pass\n- Chloé: Unsure");
    expect(text).toContain("Participant votes:\n- Alicia: 8\n- Bob: Pass\n- Chloé: Unsure");
    expect(csv).toContain('"Alice: 8\nAlice: Pass\nChloé: Unsure"');
    expect(csv).toContain('"Alicia: 8\nBob: Pass\nChloé: Unsure"');
  });

  test.each(["=HYPERLINK(\"https://example.com\")", "+SUM(1,2)", "-1+2", "@SUM(1,2)", "  =1+2", "\tformula"])("protects spreadsheet cells starting with %j", (topic) => {
    const csv = formatTaskHoldemReportCsv([entry(1, topic)], taskHoldemDeck);
    expect(csv).toContain(`"'${topic.replace(/"/g, '""')}"`);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  test.each(["=HYPERLINK(\"https://example.com\")", "+SUM(1,2)", "-1+2", "@SUM(1,2)", "  =1+2", "\tformula"])("protects participant vote cells starting with %j", (name) => {
    const round = entry(1);
    round.ballots[0]!.profile.name = name;
    const csv = formatTaskHoldemReportCsv([round], taskHoldemDeck);
    expect(csv).toContain(`"'${name.replace(/"/g, '""')}: 8\nBob: Pass\nChloé: Unsure"`);
  });

  test("quotes participant names and flattens line breaks without creating extra vote lines", () => {
    const round = entry(1);
    round.ballots[0]!.profile.name = 'A, "quoted"\r\nvoter\u2028name\u2029end';
    const text = formatTaskHoldemReportText([round], taskHoldemDeck);
    const csv = formatTaskHoldemReportCsv([round], taskHoldemDeck);
    expect(text).toContain('Participant votes:\n- A, "quoted" voter name end: 8\n- Bob: Pass\n- Chloé: Unsure');
    expect(csv).toContain('"A, ""quoted"" voter name end: 8\nBob: Pass\nChloé: Unsure"');
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
      ballots: votes.map((value, index) => ({ participantId: `private-${index}`, profile: { name: `Voter ${index}`, avatar: "robot" }, value })),
    }];
    const text = formatTaskHoldemReportText(entries, deck);
    const csv = formatTaskHoldemReportCsv(entries, deck);
    for (const output of [text, csv]) {
      expect(output).not.toContain("Voting scale");
      expect(output).not.toContain(scale.label);
    }
    for (const value of deck.filter(card => typeof card === "number")) {
      expect(text).toContain(`${value} × 1`);
      expect(csv).toContain(`"Votes for ${value}"`);
    }
    const rows = csv.trim().split("\r\n").map(row => [...row.matchAll(/"((?:[^"]|"")*)"/g)].map(cell => cell[1]!.replace(/""/g, '"')));
    const [header, row] = rows;
    expect(header).toHaveLength(10 + deck.length - 2);
    expect(row).toHaveLength(header!.length);
    for (const value of deck.filter(card => typeof card === "number")) expect(row![header!.indexOf(`Votes for ${value}`)]).toBe("1");
    for (const [index, value] of votes.entries()) {
      const label = value === "skip" ? "Pass" : value === "break" ? "Unsure" : String(value);
      expect(text).toContain(`- Voter ${index}: ${label}`);
      expect(row![header!.indexOf("Participant votes")]).toContain(`Voter ${index}: ${label}`);
    }
    if (scale.value !== "fibonacci") expect(csv).not.toContain('"Votes for 89"');
    expect(csv).not.toContain("private-");
  });

  test("refuses inconsistent history instead of silently dropping votes outside the selected deck", () => {
    const entries = [{ ...entry(1), ballots: [{ participantId: "private", profile: { name: "Private voter", avatar: "robot" }, value: 13 }] }] satisfies TaskHoldemHistoryEntry[];
    const deck = getTaskHoldemDeck("linear");
    expect(() => formatTaskHoldemReportText(entries, deck)).toThrow("does not match");
    expect(() => formatTaskHoldemReportCsv(entries, deck)).toThrow("does not match");
  });
});
