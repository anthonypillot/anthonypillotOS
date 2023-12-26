/*
 * GitHub personal interface
 */

export interface GitHubDeletionStatus {
  success: string[];
  notFound: string[];
  unauthorized: string[];
  unknown: string[];
}

export enum GitHubDeletionStatusType {
  SUCCESS = "success",
  NOT_FOUND = "notFound",
  UNAUTHORIZED = "unauthorized",
  UNKNOWN = "unknown",
}

/*
 * GitHub API responses
 */

export interface GitHubWorkflowRunApiResponse {
  total_count: number;
  workflow_runs: GitHubWorkflowRun[];
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  node_id: string;
  head_branch: string;
  head_sha: string;
  path: string;
  display_title: string;
  run_number: number;
  event: GitHubEvent;
  status: GitHubStatus;
  conclusion: GitHubConclusion;
  workflow_id: number;
  check_suite_id: number;
  check_suite_node_id: string;
  url: string;
  html_url: string;
  pull_requests: GitHubPullRequest[];
  created_at: Date;
  updated_at: Date;
  actor: GitHubActor;
  run_attempt: number;
  referenced_workflows: GitHubReferencedWorkflow[];
  run_started_at: Date;
  triggering_actor: GitHubActor;
  jobs_url: string;
  logs_url: string;
  check_suite_url: string;
  artifacts_url: string;
  cancel_url: string;
  rerun_url: string;
  previous_attempt_url: null | string;
  workflow_url: string;
  head_commit: GitHubHeadCommit;
  repository: GitHubRepository;
  head_repository: GitHubRepository;
}

interface GitHubActor {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: GitHubType;
  site_admin: boolean;
}

type GitHubType = "User" | "Bot" | "Organization" | unknown;

type GitHubConclusion = "success" | "failure" | "cancelled" | "startup_failure" | unknown;

type GitHubEvent = "push" | "pull_request" | "merge_group" | unknown;

interface GitHubHeadCommit {
  id: string;
  tree_id: string;
  message: string;
  timestamp: Date;
  author: GitHubAuthor;
  committer: GitHubAuthor;
}

interface GitHubAuthor {
  name: string;
  email: string;
}

interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubActor;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
}

interface GitHubPullRequest {
  url: string;
  id: number;
  number: number;
  head: GitHubBase;
  base: GitHubBase;
}

interface GitHubBase {
  ref: string;
  sha: string;
  repo: GitHubRepo;
}

interface GitHubRepo {
  id: number;
  url: string;
  name: string;
}

interface GitHubReferencedWorkflow {
  path: string;
  sha: string;
  ref: string;
}

type GitHubStatus = "completed" | unknown;
