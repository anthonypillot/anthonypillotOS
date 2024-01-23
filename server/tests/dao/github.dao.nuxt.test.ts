import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

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
  logger.level = -999; // is the silent level

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

    const spyGetAllWorkflowRuns = vi.spyOn(dao, "getAllWorkflowRuns");

    const result: GitHubWorkflowRun[] = await dao.getAllWorkflowRuns(information.account, information.repository, information.token);

    expect(spyGetAllWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token);

    const expected = [
      ...workflowRunsApiResponse.workflow_runs,
      ...workflowRunsApiResponse.workflow_runs,
      ...workflowRunsApiResponse.workflow_runs,
    ];

    expect(result).toEqual(expected);
    expect(result.length).toEqual(300);
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

    const runs: GitHubWorkflowRun[] = [
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
    ];

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRuns");

    const result = await dao.deleteWorkflowRuns(information.account, information.repository, information.token, runs);

    expect(spyDeleteWorkflowRuns).toHaveBeenCalledOnce();
    expect(spyDeleteWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token, runs);

    expect(result).toStrictEqual({
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
      notFound: [],
      unauthorized: [],
      unknown: [],
    });
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

    const runs: GitHubWorkflowRun[] = [
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
    ];

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRuns");

    const result = await dao.deleteWorkflowRuns(information.account, information.repository, information.token, runs);

    expect(spyDeleteWorkflowRuns).toHaveBeenCalledOnce();
    expect(spyDeleteWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token, runs);

    expect(result).toStrictEqual({
      success: [],
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
      unauthorized: [],
      unknown: [],
    });
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

    const runs: GitHubWorkflowRun[] = [
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
    ];

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRuns");

    const result = await dao.deleteWorkflowRuns(information.account, information.repository, information.token, runs);

    expect(spyDeleteWorkflowRuns).toHaveBeenCalledOnce();
    expect(spyDeleteWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token, runs);

    expect(result).toStrictEqual({
      success: [],
      notFound: [],
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
      unknown: [],
    });
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

    const runs: GitHubWorkflowRun[] = [
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
    ];

    const spyDeleteWorkflowRuns = vi.spyOn(dao, "deleteWorkflowRuns");

    const result = await dao.deleteWorkflowRuns(information.account, information.repository, information.token, runs);

    expect(spyDeleteWorkflowRuns).toHaveBeenCalledOnce();
    expect(spyDeleteWorkflowRuns).toHaveBeenCalledWith(information.account, information.repository, information.token, runs);

    expect(result).toStrictEqual({
      success: [],
      notFound: [],
      unauthorized: [],
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
  });
});
