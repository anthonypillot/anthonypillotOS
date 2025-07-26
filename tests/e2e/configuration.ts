import { application as taskHoldemApplication } from "../../shared/types/task-holdem.type";

const baseUrls = {
  local: "http://localhost:3000",
  prep: "https://prep.anthonypillot.com",
  prod: "https://anthonypillot.com",
};

function getBaseUrl(): string {
  return process.env.CI ? baseUrls.prep : baseUrls.local;
}

function createConfig(path: string): { url: string; path: string } {
  return {
    url: getBaseUrl() + path,
    path,
  };
}

export const currentUrl = getBaseUrl();

export const application = {
  githubHistoryCleaner: createConfig("/tools/github/history-cleaner"),
  taskHoldem: createConfig(taskHoldemApplication.path),
};
