import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#server/generated/prisma/client";

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    connectionTimeoutMillis: 5_000,
  });

  return new PrismaClient({ adapter });
}
