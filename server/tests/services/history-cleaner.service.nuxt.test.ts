import { beforeAll, describe, expect, test, vi } from "vitest";

import { clean } from "@/server/services/history-cleaner.service";
import { GitHubWorkflowRun } from "@/server/types/github";
import { HistoryCleanerOptions } from "@/server/types/historyCleaner.d";
import { logger } from "@/utils/logger";

import workflowRunsApiResponse from "@/server/tests/data/workflowRunsApiResponse.github.json";

import * as dao from "@/server/dao/github.dao";

beforeAll(() => {
  logger.level = -999; // is the silent level
});

describe("HistoryCleaner service", async () => {
  test("should clean all workflow runs", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(dao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRuns").mockResolvedValue({
      success: ["1", "2", "3", "4"],
      notFound: ["1", "2", "3"],
      unauthorized: ["1", "2"],
      unknown: ["1"],
    });

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(1);

    expect(result).toEqual({
      workflow: {
        success: ["1", "2", "3", "4"],
        notFound: ["1", "2", "3"],
        unauthorized: ["1", "2"],
        unknown: ["1"],
      },
      deployment: null,
    });
  });
});
