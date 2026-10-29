import { expect, request } from "@playwright/test";
import { baseURL } from "./configuration";

export default async function globalSetup(): Promise<void> {
  const api = await request.newContext({ baseURL });
  try {
    // The endpoint reports database readiness in its JSON body, not its HTTP status.
    await expect.poll(async () => {
      const response = await api.get("/api/health/ready");
      return response.json();
    }, { message: "The built application must be connected to the E2E database", timeout: 15_000 })
      .toMatchObject({ statusCode: 200 });
  } finally {
    await api.dispose();
  }
}
