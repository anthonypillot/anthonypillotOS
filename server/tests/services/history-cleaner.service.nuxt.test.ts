import { beforeAll, describe, expect, test, vi } from "vitest";

import { clean } from "@/server/services/history-cleaner.service";
import { GitHubDeletionStatusType, GitHubWorkflowRun } from "@/server/types/github.d";
import { HistoryCleanerOptions, HistoryCleanerResult } from "@/server/types/historyCleaner.d";

import { logger } from "@/server/utils/logger";

import * as githubDao from "@/server/dao/github.dao";
import * as postgresDao from "~/server/dao/postgres.dao";

import workflowRunsApiResponse from "@/server/tests/data/workflowRunsApiResponse.github.json";

const expectedResultArray = [
  {
    id: 1,
  },
  {
    id: 2,
  },
  {
    id: 3,
  },
  {
    id: 4,
  },
];

const now = new Date();

beforeAll(() => {
  logger.level = "silent";
});

describe("HistoryCleaner service", async () => {
  test("should clean all workflow runs", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(postgresDao, "create").mockResolvedValue(1);
    const spyPostgresUpdate = vi.spyOn(postgresDao, "update").mockResolvedValue({
      id: 1,
      account: "my-account",
      repository: "my-repository",
      workflowRunDeletionResult: JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      }),
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.SUCCESS);

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toEqual(100);
    expect(result.workflow?.notFound.length).toEqual(0);
    expect(result.workflow?.unauthorized.length).toEqual(0);
    expect(result.workflow?.unknown.length).toEqual(0);

    expect(spyPostgresUpdate.mock.results[0].value.account).toEqual("my-account");
    expect(spyPostgresUpdate.mock.results[0].value.repository).toEqual("my-repository");
    expect(spyPostgresUpdate.mock.results[0].value.workflowRunDeletionResult).toEqual(
      JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      })
    );
    expect(spyPostgresUpdate.mock.results[0].value.createdAt).toEqual(now);
    expect(spyPostgresUpdate.mock.results[0].value.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if workflows are not found", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(postgresDao, "create").mockResolvedValue(1);
    const spyPostgresUpdate = vi.spyOn(postgresDao, "update").mockResolvedValue({
      id: 1,
      account: "my-account",
      repository: "my-repository",
      workflowRunDeletionResult: JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      }),
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.NOT_FOUND);

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toEqual(0);
    expect(result.workflow?.notFound.length).toEqual(100);
    expect(result.workflow?.unauthorized.length).toEqual(0);
    expect(result.workflow?.unknown.length).toEqual(0);

    expect(spyPostgresUpdate.mock.results[0].value.account).toEqual("my-account");
    expect(spyPostgresUpdate.mock.results[0].value.repository).toEqual("my-repository");
    expect(spyPostgresUpdate.mock.results[0].value.workflowRunDeletionResult).toEqual(
      JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      })
    );
    expect(spyPostgresUpdate.mock.results[0].value.createdAt).toEqual(now);
    expect(spyPostgresUpdate.mock.results[0].value.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if workflows are unauthorized", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(postgresDao, "create").mockResolvedValue(1);
    const spyPostgresUpdate = vi.spyOn(postgresDao, "update").mockResolvedValue({
      id: 1,
      account: "my-account",
      repository: "my-repository",
      workflowRunDeletionResult: JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      }),
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.UNAUTHORIZED);

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toEqual(0);
    expect(result.workflow?.notFound.length).toEqual(0);
    expect(result.workflow?.unauthorized.length).toEqual(100);
    expect(result.workflow?.unknown.length).toEqual(0);

    expect(spyPostgresUpdate.mock.results[0].value.account).toEqual("my-account");
    expect(spyPostgresUpdate.mock.results[0].value.repository).toEqual("my-repository");
    expect(spyPostgresUpdate.mock.results[0].value.workflowRunDeletionResult).toEqual(
      JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      })
    );
    expect(spyPostgresUpdate.mock.results[0].value.createdAt).toEqual(now);
    expect(spyPostgresUpdate.mock.results[0].value.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if workflows are unknown", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(postgresDao, "create").mockResolvedValue(1);
    const spyPostgresUpdate = vi.spyOn(postgresDao, "update").mockResolvedValue({
      id: 1,
      account: "my-account",
      repository: "my-repository",
      workflowRunDeletionResult: JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      }),
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.UNKNOWN);

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toEqual(0);
    expect(result.workflow?.notFound.length).toEqual(0);
    expect(result.workflow?.unauthorized.length).toEqual(0);
    expect(result.workflow?.unknown.length).toEqual(100);

    expect(spyPostgresUpdate.mock.results[0].value.account).toEqual("my-account");
    expect(spyPostgresUpdate.mock.results[0].value.repository).toEqual("my-repository");
    expect(spyPostgresUpdate.mock.results[0].value.workflowRunDeletionResult).toEqual(
      JSON.stringify({
        success: expectedResultArray,
        notFound: expectedResultArray,
        unauthorized: expectedResultArray,
        unknown: expectedResultArray,
      })
    );
    expect(spyPostgresUpdate.mock.results[0].value.createdAt).toEqual(now);
    expect(spyPostgresUpdate.mock.results[0].value.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if no workflow runs are found", async () => {
    const spyGetAllWorkflowRuns = vi.spyOn(githubDao, "getAllWorkflowRuns").mockResolvedValue([]);

    const spyPostgresCreate = vi.spyOn(postgresDao, "create").mockResolvedValue(1);
    const spyPostgresUpdate = vi.spyOn(postgresDao, "update").mockResolvedValue({
      id: 1,
      account: "my-account",
      repository: "my-repository",
      workflowRunDeletionResult: JSON.stringify({
        success: [],
        notFound: [],
        unauthorized: [],
        unknown: [],
      }),
      error: "No workflow runs deleted",
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun");

    const result: HistoryCleanerResult = await clean("my-account", "my-repository", "ghp_abcd1234", [
      HistoryCleanerOptions.ALL_WORKFLOW_RUNS,
    ]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).not.toBeCalled();

    expect(result.workflow?.success.length).toEqual(0);
    expect(result.workflow?.notFound.length).toEqual(0);
    expect(result.workflow?.unauthorized.length).toEqual(0);
    expect(result.workflow?.unknown.length).toEqual(0);

    expect(spyPostgresUpdate.mock.results[0].value.account).toEqual("my-account");
    expect(spyPostgresUpdate.mock.results[0].value.repository).toEqual("my-repository");
    expect(spyPostgresUpdate.mock.results[0].value.workflowRunDeletionResult).toEqual(
      JSON.stringify({
        success: [],
        notFound: [],
        unauthorized: [],
        unknown: [],
      })
    );
    expect(spyPostgresUpdate.mock.results[0].value.createdAt).toEqual(now);
    expect(spyPostgresUpdate.mock.results[0].value.updatedAt).toEqual(now);
  });
});
