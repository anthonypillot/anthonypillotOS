import { currentUrl } from "../configuration";
import { expect, test } from "@playwright/test";

const experienceWebsites = [
  { name: "Claim", url: "https://claim.anthonypillot.com" },
  { name: "ADEO", url: "https://www.adeo.com" },
  { name: "anthonypillotOS", url: "https://anthonypillot.com" },
  { name: "Auchan", url: "https://www.auchan-retail.com" },
  { name: "Zenika", url: "https://www.zenika.com" },
] as const;

test("should have a hero section with job presentation", async ({ page }) => {
  await page.goto(currentUrl);

  expect(
    await page.getByText("Freelance Software Engineer, Real Full Stack Developer, and more.").innerText(),
  ).toBeTruthy();
  expect(await page.getByText("Lille, France. Remote and on-site work.").innerText()).toBeTruthy();
});

test("should display career highlights and open an experience technology drawer", async ({ page }) => {
  await page.goto(currentUrl, { waitUntil: "networkidle" });

  const careerHistory = page.locator('section[aria-label="Career history"]');

  await expect(careerHistory.getByRole("heading", { name: "Career history" })).toBeVisible();
  await expect(careerHistory.getByText("The roles, missions, and projects that shaped my career.")).toBeVisible();
  await expect(careerHistory.getByRole("heading", { name: "Claim" })).toBeVisible();
  await expect(careerHistory.getByRole("heading", { name: "anthonypillotOS" })).toBeVisible();
  await expect(careerHistory.getByRole("heading", { name: "ADEO" })).toBeVisible();
  await expect(careerHistory.getByRole("heading", { name: "Auchan" })).toBeVisible();
  await expect(careerHistory.getByRole("heading", { name: "Zenika" })).toBeVisible();
  await expect(careerHistory.getByText("Quality, architecture, and innersourcing")).toBeVisible();
  await expect(careerHistory.getByText("Multi-store giveaway aggregation")).toBeVisible();
  await expect(careerHistory.locator("[data-border-glow]")).toHaveCount(5);
  await expect(careerHistory.locator("article").first().getByRole("heading", { name: "Claim" })).toBeVisible();

  for (const website of experienceWebsites) {
    const link = careerHistory.getByRole("link", { name: `Visit ${website.name} website` });
    await expect(link).toHaveAttribute("href", website.url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }

  const viewport = page.viewportSize();
  if (viewport && viewport.width < 640) {
    const firstCard = await careerHistory.locator("article").first().boundingBox();
    expect(firstCard?.width ?? 0).toBeGreaterThan(viewport.width * 0.9);
  }

  await careerHistory.getByRole("button", { name: /View \d+ technologies and tools used at Claim/ }).click();

  await expect(page.getByRole("button", { name: "Close Claim technologies" })).toBeVisible();
  await expect(page.getByText("Technologies and tools used:")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
