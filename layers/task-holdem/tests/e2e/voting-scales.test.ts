import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../server/generated/prisma/client";
import { databaseURL, routes, secondaryBaseURL } from "../../../../tests/e2e/configuration";
import { expectReadableContrast } from "../../../../tests/e2e/support/contrast";
import { getTaskHoldemDeck, taskHoldemVotingScales } from "../../shared/data/decks";
import { taskHoldemRoomIdSchema } from "../../shared/schemas/room.schema";
import { taskHoldemStateSchema } from "../../server/domain/room";
import { expect, test, TaskHoldemPage } from "./support/fixtures";
import { connectTaskHoldemSocket, taskHoldemSuccess, type TaskHoldemTestSocket } from "./support/socket";

test.skip(({ isMobile, hasTouch }) => isMobile || hasTouch, "Voting scale selection has no touch-specific behavior; cover it on desktop.");

const scenarios = [
  { votingScale: "fibonacci", firstVote: 13, secondVote: 21, average: 17, invalidVote: 4 },
  { votingScale: "linear", firstVote: 4, secondVote: 10, average: 7, invalidVote: 13 },
  { votingScale: "powers-of-two", firstVote: 16, secondVote: 64, average: 40, invalidVote: 3 },
] as const;

for (const scenario of scenarios) {
  test(`${scenario.votingScale} stays shared through reloads, results, exports and subsequent rounds`, async ({ page }) => {
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseURL }) });
    const scale = taskHoldemVotingScales.find(scale => scale.value === scenario.votingScale)!;
    const deck = getTaskHoldemDeck(scale.value);
    const alice = new TaskHoldemPage(page);
    let roomId: string | undefined;
    let bob: TaskHoldemTestSocket | undefined;
    try {
      await page.goto(routes.taskHoldem);
      const picker = page.getByRole("combobox", { name: "Voting scale", exact: true });
      await expect(picker).toHaveText("Fibonacci");
      await picker.focus();
      await picker.press("Space");
      await page.getByRole("option", { name: scale.label, exact: true }).click();
      await expect(picker).toHaveText(scale.label);
      await expect(page.getByRole("list", { name: "Cards in this voting scale", exact: true }).getByRole("listitem")).toHaveText(deck.map(value => value === "skip" ? "Pass" : value === "break" ? "Unsure" : String(value)));
      await expectReadableContrast(page);
      await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Creator");
      await page.getByRole("button", { name: "Create room", exact: true }).click();
      await expect(alice.player("Creator")).toBeVisible();
      await expect(page).toHaveURL(/\?id=[a-f0-9-]+$/);
      roomId = taskHoldemRoomIdSchema.parse(new URL(page.url()).searchParams.get("id"));
      await expect(picker).toHaveCount(0);
      await expect(page.getByText(`Voting scale: ${scale.label}`, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Select .+ card$/ })).toHaveCount(deck.length);
      const stored = await prisma.taskHoldemRoom.findUniqueOrThrow({ where: { id: roomId } });
      expect(taskHoldemStateSchema.parse(stored.data).round.deck).toEqual(deck);

      bob = await connectTaskHoldemSocket(secondaryBaseURL);
      const command = { roomId, token: randomBytes(32).toString("hex"), profile: { name: "Bob", avatar: "cowboy" } } as const;
      const joined = taskHoldemSuccess(await bob.emitWithAck("room:join", command));
      expect(joined.room.round.deck).toEqual(deck);
      await expect(alice.player("Bob")).toBeVisible();
      await alice.vote(scenario.firstVote);
      const participantId = await alice.player("Creator").getAttribute("data-participant-id");
      const privateView = taskHoldemSuccess(await bob.emitWithAck("room:sync", {}));
      expect(privateView.room.round.ballots).toBeNull();
      expect(privateView.room.round.average).toBeNull();
      expect(privateView.self.vote).toBeNull();
      expect(taskHoldemSuccess(await bob.emitWithAck("room:history", {})).items).toEqual([]);
      expect(await bob.emitWithAck("round:vote", { roundId: joined.room.round.id, value: scenario.invalidVote })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });

      const retry = taskHoldemSuccess(await bob.emitWithAck("room:create", { ...command, votingScale: scale.value === "linear" ? "powers-of-two" : "linear" }));
      expect(retry.room.round.deck).toEqual(deck);
      expect(retry.room.round.id).toBe(joined.room.round.id);
      await page.reload();
      await expect(alice.player("Creator")).toHaveAttribute("data-participant-id", participantId!);
      await expect(page.getByRole("button", { name: `Select ${scenario.firstVote} card`, exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText(`Voting scale: ${scale.label}`, { exact: true })).toBeVisible();

      taskHoldemSuccess(await bob.emitWithAck("round:vote", { roundId: joined.room.round.id, value: scenario.secondVote }));
      await alice.revealCards();
      await expect(page.getByText(`Average: ${scenario.average}`, { exact: true })).toBeVisible();
      const distribution = page.getByRole("region", { name: "Vote distribution", exact: true });
      for (const value of [scenario.firstVote, scenario.secondVote]) await expect(distribution.getByRole("listitem", { name: `${value}: 1 vote`, exact: true })).toBeVisible();
      await expectReadableContrast(page);

      await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { async writeText(text: string) { document.body.dataset.copiedSummary = text; } } }));
      await page.getByRole("button", { name: /^History/ }).click();
      const history = page.getByRole("dialog", { name: "Session history", exact: true });
      await expect(history.getByText(`Average: ${scenario.average}`, { exact: true })).toBeVisible();
      await expect(history.getByText(/Voting scale:/)).toHaveCount(0);
      await history.getByRole("button", { name: "Copy summary", exact: true }).click();
      await expect(history.getByText("Room summary copied.", { exact: true })).toBeVisible();
      const text = (await page.evaluate(() => document.body.dataset.copiedSummary))!;
      expect(text).not.toContain("Voting scale");
      expect(text).not.toContain("Distribution:");
      expect(text).toContain(`- Creator: ${scenario.firstVote}`);
      expect(text).toContain(`- Bob: ${scenario.secondVote}`);
      const downloaded = page.waitForEvent("download");
      await history.getByRole("button", { name: "Download CSV", exact: true }).click();
      const csv = await readFile((await (await downloaded).path())!, "utf8");
      const rows = csv.trim().split("\r\n").map(row => [...row.matchAll(/"((?:[^"]|"")*)"/g)].map(cell => cell[1]!.replace(/""/g, '"')));
      expect(rows).toHaveLength(2);
      const [header, row] = rows;
      expect(row).toHaveLength(header!.length);
      expect(header).not.toContain("Voting scale");
      expect(row![header!.indexOf("Participant votes")]).toContain(`Creator: ${scenario.firstVote}`);
      expect(row![header!.indexOf("Participant votes")]).toContain(`Bob: ${scenario.secondVote}`);
      for (const value of deck.filter(card => typeof card === "number")) {
        expect(row![header!.indexOf(`Votes for ${value}`)]).toBe(value === scenario.firstVote || value === scenario.secondVote ? "1" : "0");
      }
      if (scale.value !== "fibonacci") expect(csv).not.toContain('"Votes for 89"');
      for (const output of [text, csv]) {
        expect(output).not.toContain(scale.label);
        expect(output).not.toContain(participantId!);
        expect(output).not.toContain(joined.self.participantId);
        expect(output).not.toContain(command.token);
      }
      await page.keyboard.press("Escape");
      await alice.restart.click();
      await expect(page.getByRole("heading", { name: "Round 2", exact: true })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "Voting scale", exact: true })).toHaveCount(0);
      const restarted = taskHoldemSuccess(await bob.emitWithAck("room:sync", {}));
      expect(restarted.room.round.deck).toEqual(deck);
      expect(restarted.self.vote).toBeNull();
      await alice.vote("skip");
      taskHoldemSuccess(await bob.emitWithAck("round:vote", { roundId: restarted.room.round.id, value: "break" }));
      await alice.revealCards();
      await expect(page.getByText("Average: N/A", { exact: true })).toBeVisible();
      await expect(distribution).toContainText("2 votes cast · 0 numeric · 1 Pass · 1 Unsure");
      await page.getByRole("button", { name: "Leave room", exact: true }).click();
      await expect(page.getByRole("button", { name: "Join game", exact: true })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "Voting scale", exact: true })).toHaveCount(0);
    } finally {
      bob?.disconnect();
      await page.close();
      if (roomId) await prisma.taskHoldemRoom.deleteMany({ where: { id: roomId } });
      await prisma.$disconnect();
    }
  });
}
