import { beforeAll, describe, expect, test, vi } from "vitest";

import { clean } from "@/server/services/history-cleaner.service";
import { GitHubWorkflowRun } from "@/server/types/github";
import { HistoryCleanerOptions } from "@/server/types/historyCleaner.d";

import * as dao from "@/server/dao/github.dao";

import workflowRunsApiResponse from "@/server/tests/data/workflowRunsApiResponse.github.json";

beforeAll(() => {
  logger.level = -999; // is the silent level
});

describe("HistoryCleaner service", async () => {
  test("should clean all workflow runs", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(dao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRuns").mockResolvedValue({
      success: [
        //@ts-ignore
        {
          id: 1,
        },
        //@ts-ignore
        {
          id: 2,
        },
        //@ts-ignore
        {
          id: 3,
        },
        //@ts-ignore
        {
          id: 4,
        },
      ],
      notFound: [
        //@ts-ignore
        {
          id: 1,
        },
        //@ts-ignore
        {
          id: 2,
        },
        //@ts-ignore
        {
          id: 3,
        },
        //@ts-ignore
        {
          id: 4,
        },
      ],
      unauthorized: [
        //@ts-ignore
        {
          id: 1,
        },
        //@ts-ignore
        {
          id: 2,
        },
        //@ts-ignore
        {
          id: 3,
        },
        //@ts-ignore
        {
          id: 4,
        },
      ],
      unknown: [
        //@ts-ignore
        {
          id: 1,
        },
        //@ts-ignore
        {
          id: 2,
        },
        //@ts-ignore
        {
          id: 3,
        },
        //@ts-ignore
        {
          id: 4,
        },
      ],
    });

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(1);

    expect(result).toEqual({
      workflow: {
        success: [
          //@ts-ignore
          {
            id: 1,
          },
          //@ts-ignore
          {
            id: 2,
          },
          //@ts-ignore
          {
            id: 3,
          },
          //@ts-ignore
          {
            id: 4,
          },
        ],
        notFound: [
          //@ts-ignore
          {
            id: 1,
          },
          //@ts-ignore
          {
            id: 2,
          },
          //@ts-ignore
          {
            id: 3,
          },
          //@ts-ignore
          {
            id: 4,
          },
        ],
        unauthorized: [
          //@ts-ignore
          {
            id: 1,
          },
          //@ts-ignore
          {
            id: 2,
          },
          //@ts-ignore
          {
            id: 3,
          },
          //@ts-ignore
          {
            id: 4,
          },
        ],
        unknown: [
          //@ts-ignore
          {
            id: 1,
          },
          //@ts-ignore
          {
            id: 2,
          },
          //@ts-ignore
          {
            id: 3,
          },
          //@ts-ignore
          {
            id: 4,
          },
        ],
      },
      deployment: null,
    });
  });
});
