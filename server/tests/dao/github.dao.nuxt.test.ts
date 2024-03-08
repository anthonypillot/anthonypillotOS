import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { logger } from "@/server/utils/logger";

import * as dao from "@/server/dao/github.dao";

import { GitHubWorkflowRun, GitHubWorkflowRunApiResponse } from "@/server/types/github";

import workflowRunsApiResponse from "@/server/tests/data/workflowRunsApiResponse.github.json";

const information = {
  account: "my-account",
  repository: "my-repository",
  token: "ghp_abcd1234",
};

const server = setupServer();

beforeAll(() => {
  logger.level = -999;

  server.listen({
    // This tells MSW to throw an error whenever it
    // encounters a request that doesn't have a
    // matching request handler.
    onUnhandledRequest: "error",
  });
});

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe("GitHub DAO", async () => {
  test("should retrieve workflow runs with success", async () => {
    workflowRunsApiResponse.total_count = 300;

    server.use(
      http.get(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs`,
        ({ request, params, cookies }) => {
          return HttpResponse.json(workflowRunsApiResponse);
        }
      )
    );

    const spyGetAllWorkflowRuns = vi.spyOn(dao, "getWorkflowRuns");

    const result: GitHubWorkflowRunApiResponse = await dao.getWorkflowRuns(information.account, information.repository, information.token);

    expect(spyGetAllWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token);

    expect(result.workflow_runs).toEqual(workflowRunsApiResponse.workflow_runs);
    expect(result.workflow_runs.length).toEqual(100);
  });

  test("should retrieve all workflow runs on multiple pages", async () => {
    workflowRunsApiResponse.total_count = 300;

    server.use(
      http.get(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs`,
        ({ request, params, cookies }) => {
          return HttpResponse.json(workflowRunsApiResponse);
        }
      )
    );

    const result: GitHubWorkflowRun[] = await dao.getAllWorkflowRuns(information.account, information.repository, information.token);

    const expected = [
      ...workflowRunsApiResponse.workflow_runs,
      ...workflowRunsApiResponse.workflow_runs,
      ...workflowRunsApiResponse.workflow_runs,
    ];

    expect(result).toEqual(expected.slice(0, 200));
    expect(result.length).toEqual(200);
  });

  test("should throw an error when cannot retrieve workflow runs", async () => {
    server.use(
      http.get(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs`,
        ({ request, params, cookies }) => {
          return HttpResponse.text(null, {
            status: 500,
          });
        }
      )
    );

    const spy = vi.spyOn(dao, "getWorkflowRuns");

    await expect(
      async () => await dao.getWorkflowRuns(information.account, information.repository, information.token)
    ).rejects.toThrowError();

    expect(spy).toHaveBeenCalledOnce();
  });

  test("should delete an array of workflow runs with success", async () => {
    server.use(
      http.delete(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs/*`,
        ({ request, params, cookies }) => {
          return HttpResponse.text(null, {
            status: 204,
          });
        }
      )
    );

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRun");

    const result = await dao.deleteWorkflowRun(information.account, information.repository, information.token, 1);

    expect(spyDeleteWorkflowRuns).toHaveBeenCalledOnce();
    expect(spyDeleteWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token, 1);

    expect(result).toStrictEqual("success");
  });

  test("should not delete an array of not found workflow runs", async () => {
    server.use(
      http.delete(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs/*`,
        ({ request, params, cookies }) => {
          return HttpResponse.text(null, {
            status: 404,
          });
        }
      )
    );

    const result = await dao.deleteWorkflowRun(information.account, information.repository, information.token, 1);

    expect(result).toStrictEqual("notFound");
  });

  test("should not delete an array of unauthorized workflow runs", async () => {
    server.use(
      http.delete(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs/*`,
        ({ request, params, cookies }) => {
          return HttpResponse.text(null, {
            status: 401,
          });
        }
      )
    );

    const result = await dao.deleteWorkflowRun(information.account, information.repository, information.token, 1);

    expect(result).toStrictEqual("unauthorized");
  });

  test("should not delete an array of unknown workflow runs", async () => {
    server.use(
      http.delete(
        `https://api.github.com/repos/${information.account}/${information.repository}/actions/runs/*`,
        ({ request, params, cookies }) => {
          return HttpResponse.text(null, {
            status: 502,
          });
        }
      )
    );

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRun");

    const result = await dao.deleteWorkflowRun(information.account, information.repository, information.token, 1);

    expect(spyDeleteWorkflowRuns).toHaveBeenCalledOnce();
    expect(spyDeleteWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token, 1);

    expect(result).toStrictEqual("unknown");
  });
});
