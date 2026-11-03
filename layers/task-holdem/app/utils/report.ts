import type { TaskHoldemHistoryEntry, TaskHoldemHistoryPage, TaskHoldemVote } from "../../shared/types/room.type";
import { getTaskHoldemVotingScale } from "../../shared/data/decks";
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

function validateReportDeck(entries: readonly TaskHoldemHistoryEntry[], deck: readonly TaskHoldemVote[]): void {
  if (!getTaskHoldemVotingScale(deck) || entries.some(entry => entry.ballots.some(ballot => !deck.includes(ballot.value)))) {
    throw new Error("The room history does not match its voting scale.");
  }
}

function formatParticipantVotes(entry: TaskHoldemHistoryEntry): string[] {
  return entry.ballots.map(ballot => `${ballot.profile.name.replace(/[\r\n\u2028\u2029]+/g, " ")}: ${formatTaskHoldemVote(ballot.value)}`);
}

function formatRoundDuration(startedAt: number, revealedAt: number): string {
  const totalSeconds = Math.max(0, Math.round((revealedAt - startedAt) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  return [
    hours > 0 ? `${hours}h` : null,
    hours > 0 || minutes > 0 ? `${minutes}m` : null,
    `${totalSeconds % 60}s`,
  ].filter(Boolean).join(" ");
}

export function formatTaskHoldemReportText(entries: readonly TaskHoldemHistoryEntry[], deck: readonly TaskHoldemVote[], exportedAt = new Date()): string {
  validateReportDeck(entries, deck);
  const header = `TaskHold’em · Room summary\nAverages use numeric votes and are not agreed estimates.\nDate: ${exportedAt.toISOString().slice(0, 10)}`;
  const rounds = entries.map(entry => [
    `Round ${entry.number} — ${(entry.topic || "Untitled round").replace(/[\r\n]+/g, " ")}`,
    `Duration: ${formatRoundDuration(entry.startedAt, entry.revealedAt)}`,
    `Average: ${formatTaskHoldemAverage(entry.average)}`,
    "Participant votes:",
    formatParticipantVotes(entry).map(vote => `- ${vote}`).join("\n") || "No votes",
  ].join("\n"));
  return [header, ...rounds].join("\n\n");
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[\t\r\n]|^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function formatTaskHoldemReportCsv(entries: readonly TaskHoldemHistoryEntry[], deck: readonly TaskHoldemVote[]): string {
  validateReportDeck(entries, deck);
  const numericCards = deck.filter(value => typeof value === "number");
  const header = ["Round", "Topic", "Started at (UTC)", "Revealed at (UTC)", "Average (numeric votes, not an agreed estimate)", "Total votes", "Numeric votes", "Pass", "Unsure", ...numericCards.map(value => `Votes for ${value}`), "Participant votes"];
  const rows = entries.map((entry) => {
    const summary = getTaskHoldemVoteSummary(entry.ballots.map(ballot => ballot.value));
    return [
      entry.number, entry.topic || "Untitled round", new Date(entry.startedAt).toISOString(), new Date(entry.revealedAt).toISOString(),
      formatTaskHoldemAverage(entry.average), summary.total, summary.numeric, summary.pass, summary.unsure,
      ...numericCards.map(value => summary.distribution.find(group => group.value === value)?.count ?? 0),
      formatParticipantVotes(entry).join("\n") || "No votes",
    ];
  });
  return `\uFEFF${[header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
