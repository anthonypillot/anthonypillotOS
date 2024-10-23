import { beforeAll, describe, expect, test, vi } from "vitest";

import { proceed } from "@/server/services/history-cleaner.service";
import { GitHubDeletionStatusType, type GitHubWorkflowRun } from "@/server/types/github.type";
import { HistoryCleanerOptions, type HistoryCleanerJob, HistoryCleanerJobStatus } from "@/server/types/history-cleaner.type";

import { logger } from "@/server/utils/logger";

import * as githubDao from "@/server/dao/github.dao";
import * as historyCleanerRepository from "@/server/dao/history-cleaner.dao";

import workflowRunsApiResponse from "@/server/tests/data/workflowRunsApiResponse.github.json";

const uuid: string = "00000000-0000-0000-0000-000000000000";

const now = new Date();

beforeAll(() => {
  logger.level = -999;
});

describe("HistoryCleaner service", async () => {
  test("should clean all workflow runs", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(historyCleanerRepository, "create").mockResolvedValue(uuid);
    const spyPostgresUpdate = vi.spyOn(historyCleanerRepository, "update").mockResolvedValue({
      id: uuid,
      account: "my-account",
      repository: "my-repository",
      status: HistoryCleanerJobStatus.COMPLETED,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.SUCCESS);

    const result: HistoryCleanerJob = await proceed("my-account", "my-repository", "ghp_abcd1234", [HistoryCleanerOptions.WORKFLOW_RUNS]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);
    expect(spyPostgresUpdate.mock.calls[0][1]).toEqual(HistoryCleanerJobStatus.COMPLETED);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toEqual(100);
    expect(result.workflow?.notFound.length).toEqual(0);
    expect(result.workflow?.unauthorized.length).toEqual(0);
    expect(result.workflow?.unknown.length).toEqual(0);

    expect(spyPostgresUpdate.mock.settledResults[0].value.account).toEqual("my-account");
    expect(spyPostgresUpdate.mock.settledResults[0].value.repository).toEqual("my-repository");
    expect(spyPostgresUpdate.mock.settledResults[0].value.status).toEqual(HistoryCleanerJobStatus.COMPLETED);
    expect(spyPostgresUpdate.mock.settledResults[0].value.createdAt).toEqual(now);
    expect(spyPostgresUpdate.mock.settledResults[0].value.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if workflows are not found", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(historyCleanerRepository, "create").mockResolvedValue(uuid);
    const spyPostgresUpdate = vi.spyOn(historyCleanerRepository, "update").mockResolvedValue({
      id: uuid,
      account: "my-account",
      repository: "my-repository",
      status: HistoryCleanerJobStatus.COMPLETED,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.NOT_FOUND);

    const result: HistoryCleanerJob = await proceed("my-account", "my-repository", "ghp_abcd1234", [HistoryCleanerOptions.WORKFLOW_RUNS]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);
    expect(spyPostgresUpdate.mock.calls[0][1]).toEqual(HistoryCleanerJobStatus.COMPLETED);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toBe(0);
    expect(result.workflow?.notFound.length).toBe(100);
    expect(result.workflow?.unauthorized.length).toBe(0);
    expect(result.workflow?.unknown.length).toBe(0);

    const firstSpyPostgresUpdateResult = spyPostgresUpdate.mock.settledResults[0].value;

    expect(firstSpyPostgresUpdateResult.account).toEqual("my-account");
    expect(firstSpyPostgresUpdateResult.repository).toEqual("my-repository");
    expect(firstSpyPostgresUpdateResult.status).toEqual(HistoryCleanerJobStatus.COMPLETED);
    expect(firstSpyPostgresUpdateResult.createdAt).toEqual(now);
    expect(firstSpyPostgresUpdateResult.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if workflows are unauthorized", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(historyCleanerRepository, "create").mockResolvedValue(uuid);
    const spyPostgresUpdate = vi.spyOn(historyCleanerRepository, "update").mockResolvedValue({
      id: uuid,
      account: "my-account",
      repository: "my-repository",
      status: HistoryCleanerJobStatus.COMPLETED,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.UNAUTHORIZED);

    const result: HistoryCleanerJob = await proceed("my-account", "my-repository", "ghp_abcd1234", [HistoryCleanerOptions.WORKFLOW_RUNS]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);
    expect(spyPostgresUpdate.mock.calls[0][1]).toEqual(HistoryCleanerJobStatus.COMPLETED);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toBe(0);
    expect(result.workflow?.notFound.length).toBe(0);
    expect(result.workflow?.unauthorized.length).toBe(100);
    expect(result.workflow?.unknown.length).toBe(0);

    const firstSpyPostgresUpdateResult = spyPostgresUpdate.mock.settledResults[0].value;

    expect(firstSpyPostgresUpdateResult.account).toEqual("my-account");
    expect(firstSpyPostgresUpdateResult.repository).toEqual("my-repository");
    expect(firstSpyPostgresUpdateResult.status).toEqual(HistoryCleanerJobStatus.COMPLETED);
    expect(firstSpyPostgresUpdateResult.createdAt).toEqual(now);
    expect(firstSpyPostgresUpdateResult.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if workflows are unknown", async () => {
    const spyGetAllWorkflowRuns = vi
      .spyOn(githubDao, "getAllWorkflowRuns")
      .mockResolvedValue(workflowRunsApiResponse.workflow_runs as unknown as GitHubWorkflowRun[]);

    const spyPostgresCreate = vi.spyOn(historyCleanerRepository, "create").mockResolvedValue(uuid);
    const spyPostgresUpdate = vi.spyOn(historyCleanerRepository, "update").mockResolvedValue({
      id: uuid,
      account: "my-account",
      repository: "my-repository",
      status: HistoryCleanerJobStatus.COMPLETED,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun").mockResolvedValue(GitHubDeletionStatusType.UNKNOWN);

    const result: HistoryCleanerJob = await proceed("my-account", "my-repository", "ghp_abcd1234", [HistoryCleanerOptions.WORKFLOW_RUNS]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);
    expect(spyPostgresUpdate.mock.calls[0][1]).toEqual(HistoryCleanerJobStatus.COMPLETED);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).toBeCalledTimes(100);

    expect(result.workflow?.success.length).toBe(0);
    expect(result.workflow?.notFound.length).toBe(0);
    expect(result.workflow?.unauthorized.length).toBe(0);
    expect(result.workflow?.unknown.length).toBe(100);

    const firstSpyPostgresUpdateResult = spyPostgresUpdate.mock.settledResults[0].value;

    expect(firstSpyPostgresUpdateResult.account).toEqual("my-account");
    expect(firstSpyPostgresUpdateResult.repository).toEqual("my-repository");
    expect(firstSpyPostgresUpdateResult.status).toEqual(HistoryCleanerJobStatus.COMPLETED);
    expect(firstSpyPostgresUpdateResult.createdAt).toEqual(now);
    expect(firstSpyPostgresUpdateResult.updatedAt).toEqual(now);
  });

  test("should not clean all workflow runs if no workflow runs are found", async () => {
    const spyGetAllWorkflowRuns = vi.spyOn(githubDao, "getAllWorkflowRuns").mockResolvedValue([]);

    const spyPostgresCreate = vi.spyOn(historyCleanerRepository, "create").mockResolvedValue(uuid);
    const spyPostgresUpdate = vi.spyOn(historyCleanerRepository, "update").mockResolvedValue({
      id: uuid,
      account: "my-account",
      repository: "my-repository",
      status: HistoryCleanerJobStatus.COMPLETED,
      createdAt: now,
      updatedAt: now,
    });

    const spyDeleteWorkflowRuns = vi.spyOn(githubDao, "deleteWorkflowRun");

    const result: HistoryCleanerJob = await proceed("my-account", "my-repository", "ghp_abcd1234", [HistoryCleanerOptions.WORKFLOW_RUNS]);

    expect(spyPostgresCreate).toBeCalledTimes(1);
    expect(spyPostgresUpdate).toBeCalledTimes(1);
    expect(spyPostgresUpdate.mock.calls[0][1]).toEqual(HistoryCleanerJobStatus.COMPLETED);

    expect(spyGetAllWorkflowRuns).toBeCalledTimes(1);
    expect(spyDeleteWorkflowRuns).not.toBeCalled();

    expect(result.workflow?.success.length).not.toBeTruthy();
    expect(result.workflow?.notFound.length).not.toBeTruthy();
    expect(result.workflow?.unauthorized.length).not.toBeTruthy();
    expect(result.workflow?.unknown.length).not.toBeTruthy();

    const firstSpyPostgresUpdateResult = spyPostgresUpdate.mock.settledResults[0].value;

    expect(firstSpyPostgresUpdateResult.account).toEqual("my-account");
    expect(firstSpyPostgresUpdateResult.repository).toEqual("my-repository");
    expect(firstSpyPostgresUpdateResult.status).toEqual(HistoryCleanerJobStatus.COMPLETED);
    expect(firstSpyPostgresUpdateResult.createdAt).toEqual(now);
    expect(firstSpyPostgresUpdateResult.updatedAt).toEqual(now);
  });
});
