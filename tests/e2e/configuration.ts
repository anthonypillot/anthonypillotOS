export const baseURL = "http://127.0.0.1:4173";
export const secondaryBaseURL = "http://127.0.0.1:4174";

// Deliberately independent of .env and POSTGRES_PRISMA_URL: never use a developer or deployed database.
export const databaseURL = "postgresql://e2e:e2e@127.0.0.1:55439/os_e2e_postgres";

export const routes = {
  home: "/",
  tools: "/tools",
  githubHistoryCleaner: "/tools/github/history-cleaner",
  itFacts: "/tools/it-facts/application",
  itFactsLanding: "/tools/it-facts",
  taskHoldem: "/tools/task-holdem/application",
  taskHoldemLanding: "/tools/task-holdem",
};
