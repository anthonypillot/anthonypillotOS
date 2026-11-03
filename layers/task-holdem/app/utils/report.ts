import { taskHoldemDeck, type TaskHoldemHistoryEntry, type TaskHoldemHistoryPage } from "../../shared/types/room.type";
import { formatTaskHoldemAverage, formatTaskHoldemVote } from "./cards";
import { getTaskHoldemVoteSummary } from "./results";

export type TaskHoldemHistoryLoader = (before?: number) => Promise<TaskHoldemHistoryPage | undefined>;

async function waitForNextPage(signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve(); };
    const timer = setTimeout(finish, 250);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
  });
  signal.throwIfAborted();
}

export async function loadTaskHoldemReport(load: TaskHoldemHistoryLoader, through: number, signal: AbortSignal): Promise<TaskHoldemHistoryEntry[]> {
  const entries = new Map<number, TaskHoldemHistoryEntry>();
  const ids = new Set<string>();
  let before = through + 1;
  while (through > 0) {
    signal.throwIfAborted();
    const page = await load(before);
    signal.throwIfAborted();
    if (!page) throw new Error("The room history could not be loaded.");
    for (const entry of page.items) {
      if (entry.number <= 0 || entry.number >= before || entries.has(entry.number) || ids.has(entry.id)) throw new Error("The room history is inconsistent.");
      entries.set(entry.number, entry);
      ids.add(entry.id);
    }
    if (page.nextBefore === null) break;
    if (!Number.isInteger(page.nextBefore) || page.nextBefore <= 0 || page.nextBefore >= before) throw new Error("The history cursor did not advance.");
    before = page.nextBefore;
    // Leave room for normal commands within the gateway's shared rate limit.
    await waitForNextPage(signal);
  }
  signal.throwIfAborted();
  if (entries.size !== through) throw new Error("The room history is incomplete.");
  return [...entries.values()].sort((left, right) => left.number - right.number);
}

export function formatTaskHoldemReportText(entries: readonly TaskHoldemHistoryEntry[]): string {
  const header = "TaskHold’em · Room summary\nTimes are in UTC. Averages use numeric votes and are not agreed estimates.";
  const rounds = entries.map((entry) => {
    const summary = getTaskHoldemVoteSummary(entry.ballots.map(ballot => ballot.value));
    return [
      `Round ${entry.number} — ${(entry.topic || "Untitled round").replace(/[\r\n]+/g, " ")}`,
      `Started: ${new Date(entry.startedAt).toISOString()}`,
      `Revealed: ${new Date(entry.revealedAt).toISOString()}`,
      `Average: ${formatTaskHoldemAverage(entry.average)}`,
      `Votes: ${summary.total} total · ${summary.numeric} numeric · ${summary.pass} Pass · ${summary.unsure} Unsure`,
      `Distribution: ${summary.distribution.map(group => `${formatTaskHoldemVote(group.value)} × ${group.count}`).join(" · ") || "No votes"}`,
    ].join("\n");
  });
  return [header, ...rounds].join("\n\n");
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[\t\r\n]|^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function formatTaskHoldemReportCsv(entries: readonly TaskHoldemHistoryEntry[]): string {
  const numericCards = taskHoldemDeck.filter(value => typeof value === "number");
  const header = ["Round", "Topic", "Started at (UTC)", "Revealed at (UTC)", "Average (numeric votes, not an agreed estimate)", "Total votes", "Numeric votes", "Pass", "Unsure", ...numericCards.map(value => `Votes for ${value}`)];
  const rows = entries.map((entry) => {
    const summary = getTaskHoldemVoteSummary(entry.ballots.map(ballot => ballot.value));
    return [
      entry.number, entry.topic || "Untitled round", new Date(entry.startedAt).toISOString(), new Date(entry.revealedAt).toISOString(),
      formatTaskHoldemAverage(entry.average), summary.total, summary.numeric, summary.pass, summary.unsure,
      ...numericCards.map(value => summary.distribution.find(group => group.value === value)?.count ?? 0),
    ];
  });
  return `\uFEFF${[header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
