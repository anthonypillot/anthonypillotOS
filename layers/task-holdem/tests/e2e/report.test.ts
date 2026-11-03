import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../server/generated/prisma/client";
import { databaseURL } from "../../../../tests/e2e/configuration";
import { taskHoldemStateSchema } from "../../server/domain/room";
import { expect, test } from "./support/fixtures";

test("text and CSV summaries include all revealed participant votes without private round data or internal identifiers", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await alice.vote(13);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
  const participantIds = [randomUUID(), randomUUID(), randomUUID()];
  try {
    const room = await prisma.taskHoldemRoom.findUniqueOrThrow({ where: { id: roomId } });
    const state = taskHoldemStateSchema.parse(room.data);
    state.round.number = 24;
    state.round.topic = "Unrevealed private topic";
    await prisma.$transaction([
      prisma.taskHoldemRound.createMany({ data: Array.from({ length: 23 }, (_, index) => ({
        id: randomUUID(), roomId, number: index + 1, topic: index === 0 ? '=HYPERLINK("https://example.com")' : `Archived task ${index + 1}`,
        startedAt: new Date(1000), revealedAt: new Date(3000),
        ballots: [
          { participantId: participantIds[0]!, profile: { name: "Archived voter", avatar: "cowboy" }, value: 8 },
          { participantId: participantIds[1]!, profile: { name: "Pass voter", avatar: "officer" }, value: "skip" },
          { participantId: participantIds[2]!, profile: { name: "Unsure voter", avatar: "robot" }, value: "break" },
        ],
      })) }),
      prisma.taskHoldemRoom.update({ where: { id: roomId }, data: { data: state, revision: { increment: 1 } } }),
    ]);
    await alice.page.reload();
    await expect(alice.player("Alice")).toBeVisible();
    await alice.page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { async writeText(text: string) { document.body.dataset.copiedSummary = text; } } }));
    await alice.page.getByRole("button", { name: /^History/ }).click();
    const dialog = alice.page.getByRole("dialog", { name: "Session history", exact: true });
    await expect(dialog.getByText(/Voting scale:/)).toHaveCount(0);
    await expect(dialog.getByText("All revealed rounds · Player names and votes · UTC timestamps · No chat", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Copy summary", exact: true }).click();
    await expect(dialog.getByText("Room summary copied.", { exact: true })).toBeVisible();
    const text = (await alice.page.evaluate(() => document.body.dataset.copiedSummary))!;
    expect(text.match(/^Round \d+ —/gm)).toHaveLength(23);
    expect(text).toContain("Round 1 — =HYPERLINK");
    expect(text).toContain("Round 23 — Archived task 23");
    expect(text.match(/^Participant votes:$/gm)).toHaveLength(23);
    expect(text).toContain("Participant votes:\n- Archived voter: 8\n- Pass voter: Pass\n- Unsure voter: Unsure");
    const downloadPromise = alice.page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download CSV", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^task-holdem-results-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = await readFile((await download.path())!, "utf8");
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(24);
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"Archived task 23"');
    expect(csv).toContain('"Participant votes"');
    expect(csv.match(/"Archived voter: 8\nPass voter: Pass\nUnsure voter: Unsure"/g)).toHaveLength(23);
    for (const output of [text, csv]) {
      expect(output).not.toContain("Unrevealed private topic");
      expect(output).not.toContain("Alice");
      expect(output).not.toContain("participantId");
      expect(output).not.toContain("Voting scale");
      for (const id of participantIds) expect(output).not.toContain(id);
    }
  } finally { await prisma.$disconnect(); }
});

test("clipboard refusal preserves a selectable summary and allows copying it from a fresh gesture", async ({ roomId, createPlayer }) => {
  const alice = await createPlayer(roomId, "Alice");
  await alice.vote("break");
  await alice.revealCards();
  await expect(alice.page.getByText("Average: N/A", { exact: true })).toBeVisible();
  await alice.page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { async writeText() { throw new DOMException("Denied", "NotAllowedError"); } } }));
  await alice.page.getByRole("button", { name: /^History/ }).click();
  const dialog = alice.page.getByRole("dialog", { name: "Session history", exact: true });
  await dialog.getByRole("button", { name: "Copy summary", exact: true }).click();
  const summary = dialog.getByRole("textbox", { name: "Select and copy this summary", exact: true });
  await expect(summary).toHaveValue(/Average: N\/A/);
  await expect(summary).toHaveValue(/Participant votes:\n- Alice: Unsure/);
  await expect(summary).not.toHaveValue(/Voting scale/);
  await summary.focus();
  expect(await summary.evaluate(element => element instanceof HTMLTextAreaElement && element.selectionEnd - element.selectionStart === element.value.length)).toBe(true);
  await alice.page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { async writeText(text: string) { document.body.dataset.copiedSummary = text; } } }));
  await dialog.getByRole("button", { name: "Copy prepared summary", exact: true }).click();
  await expect(dialog.getByText("Room summary copied.", { exact: true })).toBeVisible();
  await expect(summary).toHaveCount(0);
});
