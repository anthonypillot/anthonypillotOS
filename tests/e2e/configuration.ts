export const baseURL = "http://127.0.0.1:4173";

// Deliberately independent of .env and POSTGRES_PRISMA_URL: never use a developer or deployed database.
export const databaseURL = "postgresql://e2e:e2e@127.0.0.1:55439/anthonypillotos_e2e";

export const routes = {
  home: "/",
  tools: "/tools",
  githubHistoryCleaner: "/tools/github/history-cleaner",
  itFacts: "/tools/it-facts/application",
  itFactsLanding: "/tools/it-facts",
  taskHoldem: "/tools/task-holdem/application",
  taskHoldemLanding: "/tools/task-holdem",
};
