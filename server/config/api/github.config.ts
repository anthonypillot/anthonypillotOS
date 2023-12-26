export function getApiConfiguration() {
  return $fetch.create({
    baseURL: "https://api.github.com",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}
