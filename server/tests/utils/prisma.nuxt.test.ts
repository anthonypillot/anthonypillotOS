import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#server/generated/prisma/client";
import { createPrismaClient } from "#server/utils/prisma";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: vi.fn() }));
vi.mock("#server/generated/prisma/client", () => ({ PrismaClient: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("POSTGRES_PRISMA_URL", "postgres://test:password@localhost:5432/test");
});

afterEach(() => vi.unstubAllEnvs());

describe("Prisma client setup", () => {
  test("uses the PostgreSQL adapter and preserves the connection timeout", () => {
    const client = createPrismaClient();
    const adapter = vi.mocked(PrismaPg).mock.instances[0];

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: process.env.POSTGRES_PRISMA_URL,
      connectionTimeoutMillis: 5_000,
    });
    expect(adapter).toBeDefined();
    expect(PrismaClient).toHaveBeenCalledWith({ adapter });
    expect(client).toBeInstanceOf(PrismaClient);
  });

  test("creates independent clients for each caller", () => {
    const firstClient = createPrismaClient();
    const secondClient = createPrismaClient();

    expect(firstClient).not.toBe(secondClient);
    expect(PrismaPg).toHaveBeenCalledTimes(2);
    expect(PrismaClient).toHaveBeenCalledTimes(2);
  });
});
