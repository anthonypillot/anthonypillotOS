import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../../server/generated/prisma/client";
import type { BrowserContext, Page } from "@playwright/test";
import { databaseURL, routes } from "../../../../../tests/e2e/configuration";
import { capturePageDiagnostics, expect, test as base } from "../../../../../tests/e2e/support/fixtures";
import { createTaskHoldemTestRoom } from "./task-holdem-socket";
import type { TaskHoldemProfile } from "../../../shared/types/task-holdem.type";
import { taskHoldemMascots } from "../../../shared/data/task-holdem-mascots";

type Avatar = TaskHoldemProfile["avatar"];

type CreatePlayer = (roomId: string, name: string, avatar?: Avatar) => Promise<TaskHoldemPage>;

type Fixtures = {
  roomId: string;
  createPlayer: CreatePlayer;
};

type PlayerContext = { context: BrowserContext; name: string };

export class TaskHoldemPage {
  constructor(readonly page: Page) {}

  get reveal() { return this.page.getByTestId("reveal-button"); }
  get restart() { return this.page.getByTestId("restart-button"); }

  player(name: string) {
    return this.page.getByRole("group", { name, exact: true });
  }

  async join(roomId: string, name: string, avatar: Avatar = "cowboy"): Promise<void> {
    await this.page.goto(`${routes.taskHoldem}?id=${roomId}`);
    await this.page.getByPlaceholder("Your name", { exact: true }).fill(name);
    await this.page.getByRole("radio", { name: taskHoldemMascots[avatar].name, exact: true }).check();
    await this.page.getByRole("button", { name: "Join game", exact: true }).click();
    await expect(this.player(name)).toBeVisible();
  }

  async vote(value: number | "skip" | "break"): Promise<void> {
    await this.page.getByRole("button", { name: `Select ${value} card`, exact: true }).click();
    await expect(this.page.getByRole("button", { name: `Select ${value} card`, exact: true })).toHaveAttribute("aria-pressed", "true");
  }

  async openChat(): Promise<void> {
    await this.page.getByRole("button", { name: "Open chat", exact: true }).click();
    await expect(this.page.getByPlaceholder("Your message", { exact: true })).toBeVisible();
  }
}

export const test = base.extend<Fixtures>({
  roomId: async ({ diagnostics }, use) => {
    const id = randomUUID();
    diagnostics.push(`Room: ${id}`);
    await use(id);
  },
  createPlayer: async ({ browser, baseURL, roomId, viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, colorScheme, diagnostics }, use, testInfo) => {
    const players: PlayerContext[] = [];
    const roomIds = new Set<string>();
    const adapter = new PrismaPg({ connectionString: databaseURL, connectionTimeoutMillis: 5_000 });
    const prisma = new PrismaClient({ adapter });

    async function ensureRoom(id: string): Promise<void> {
      if (roomIds.has(id)) return;
      roomIds.add(id);
      await createTaskHoldemTestRoom(baseURL!, id);
    }

    try {
      await ensureRoom(roomId);
      await use(async (roomId, name, avatar = "cowboy") => {
        await ensureRoom(roomId);
        const context = await browser.newContext({
          baseURL, viewport, userAgent, isMobile, hasTouch, deviceScaleFactor,
          colorScheme, reducedMotion: "reduce", serviceWorkers: "block",
        });
        players.push({ context, name });
        const page = await context.newPage();
        capturePageDiagnostics(page, diagnostics);
        const player = new TaskHoldemPage(page);
        await player.join(roomId, name, avatar);
        return player;
      });
    } finally {
      try {
        for (const { context, name } of players) {
          try {
            if (testInfo.status !== testInfo.expectedStatus) {
              for (const page of context.pages()) {
                await testInfo.attach(`${name}-screenshot`, { body: await page.screenshot(), contentType: "image/png" });
              }
            }
          } finally {
            await context.close();
          }
        }

        for (const id of roomIds) {
          await expect.poll(() => prisma.taskHoldemConnection.count({
            where: { roomId: id, connected: true },
          })).toBe(0);
          await prisma.taskHoldemRoom.deleteMany({ where: { id } });
        }
      } finally {
        await Promise.all(players.map(({ context }) => context.close()));
        await prisma.$disconnect();
      }
    }
  },
});

export { expect } from "../../../../../tests/e2e/support/fixtures";
