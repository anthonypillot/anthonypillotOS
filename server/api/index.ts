import { dependencies, devDependencies } from "@@/package.json";

interface ApplicationResponse {
  name: string;
  description: string;
  version: string;
  git_sha: string;
  environment: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export default defineEventHandler(async (event): Promise<ApplicationResponse> => {
  const config = useRuntimeConfig();

  return {
    name: config.public.title,
    description: config.public.description,
    version: config.public.version,
    git_sha: process.env.GIT_SHA || "local",
    environment: process.env.ENV || "local",
    dependencies,
    devDependencies,
  };
});
