import { routes } from "../configuration";
import { expect, test } from "../support/fixtures";

const experienceWebsites = [
  { name: "Claim", url: "https://claim.anthonypillot.com" },
  { name: "ADEO", url: "https://www.adeo.com" },
  { name: "anthonypillotOS", url: "https://anthonypillot.com" },
  { name: "Auchan", url: "https://www.auchan-retail.com" },
  { name: "Zenika", url: "https://www.zenika.com" },
] as const;

test("should have a hero section with job presentation", async ({ page }) => {
  await page.goto(routes.home);

  await expect(page.getByText("Freelance Software Engineer, Real Full Stack Developer, and more.")).toBeVisible();
  await expect(page.getByText("Lille, France. Remote and on-site work.")).toBeVisible();
});

test("hero retains a vivid indigo gradient throughout its animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(routes.home);
  const hero = page.locator("main section").first();
  const accent = await hero.evaluate((element) => {
    const color = getComputedStyle(element).backgroundImage.match(/(?:oklch|rgba?|color)\([^)]+\)/)?.[0];
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!color || !context) throw new Error("The hero must expose a decorative gradient color");
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  });
  const [red = 0, green = 0, blue = 0] = accent;
  expect(blue).toBeGreaterThan(180);
  expect(blue - Math.max(red, green)).toBeGreaterThan(100);

  for (const [time, position] of [[0, "0% 50%"], [5000, "100% 50%"]] as const) {
    await hero.evaluate((element, time) => {
      const animation = element.getAnimations().find(animation => animation instanceof CSSAnimation && animation.animationName.startsWith("gradient-animation"));
      if (!animation) throw new Error("The hero gradient must stay animated");
      animation.pause();
      animation.currentTime = time;
    }, time);
    await expect(hero).toHaveCSS("background-position", position);
  }
});

test("should display the Plausible logo in the hero", async ({ page }) => {
  await page.goto(routes.home);

  const hero = page.locator("main section").first();
  const link = hero.getByRole("link", { name: "Plausible", exact: true });
  const logo = link.getByRole("img", { name: "Plausible", exact: true });

  await expect(link).toHaveAttribute("href", "https://plausible.io");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute("src", /\/svg\/icons\/plausible\.svg$/);
  await expect.poll(() => logo.evaluate((image) => (image instanceof HTMLImageElement ? image.naturalWidth : 0))).toBeGreaterThan(0);
  await expect(hero.getByRole("img", { name: "Matomo", exact: true })).toHaveCount(0);
});

test("should distinguish personal projects from freelance career roles", async ({ page }) => {
  await page.goto(routes.home);

  const careerHistory = page.locator('section[aria-label="Career history"]');

  for (const name of ["Claim", "anthonypillotOS"]) {
    const experience = careerHistory.locator("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(experience.getByText("Full Stack Developer - Personal project", { exact: true })).toBeVisible();
  }

  const adeo = careerHistory.locator("article").filter({ has: page.getByRole("heading", { name: "ADEO", exact: true }) });
  await expect(adeo.getByText("Lead Developer - Freelance", { exact: true })).toBeVisible();
});

test("should display career highlights and open an experience technology drawer", async ({ page }) => {
  await page.goto(routes.home);

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
