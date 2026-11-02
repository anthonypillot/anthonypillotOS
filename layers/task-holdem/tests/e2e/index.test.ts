import { expect, test } from "../../../../tests/e2e/support/fixtures";
import { routes } from "../../../../tests/e2e/configuration";

test("landing page links to the multiplayer application", async ({ page }) => {
  await page.goto(routes.taskHoldemLanding);
  await expect(page.getByRole("heading", { name: "TaskHold’em", level: 1 })).toBeVisible();
  await expect(page.getByTestId("task-holdem-launch")).toHaveAttribute("href", routes.taskHoldem);
  const logo = page.locator('img[src*="task-holdem/logo.svg"]').first();
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(logo).toHaveCSS("width", (page.viewportSize()?.width ?? 0) < 640 ? "64px" : "80px");
  await expect(page.getByRole("heading", { name: "TaskHold’em", level: 1 })).toHaveCSS("font-size", (page.viewportSize()?.width ?? 0) < 640 ? "30px" : "36px");
  await expect(page.getByText("A shared perspective on what's next", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Free to use. No accounts. Just your team.", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("task-holdem-launch")).toHaveAttribute("data-auto-animate", "true");
  await expect(page.getByTestId("task-holdem-launch").locator(".iconify")).toHaveCount(0);
  const symbols = page.locator(".holdem-hero [data-suit]");
  await expect(symbols).toHaveCount(3);
  const primaryColor = await page.getByText("More alignment.", { exact: true }).evaluate(element => getComputedStyle(element).color);
  for (const symbol of await symbols.all()) {
    await expect(symbol).toHaveCSS("color", primaryColor);
    await expect(symbol).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(symbol).toHaveCSS("-webkit-text-stroke-width", "0px");
  }
});

test("landing illustration brings three application characters together without a surrounding frame", async ({ page }) => {
  await page.goto(routes.taskHoldemLanding);
  const preview = page.getByTestId("task-holdem-preview");
  await expect(preview).toHaveCSS("border-top-width", "0px");
  await expect(preview).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(preview).toHaveCSS("box-shadow", "none");
  await expect(preview).toHaveAttribute("aria-hidden", "true");
  await expect(preview.locator("a, button, input, [tabindex]")).toHaveCount(0);
  const players = preview.getByTestId("preview-player");
  await expect(players).toHaveCount(3);
  expect(await players.locator("[data-mascot]").evaluateAll(avatars => avatars.map(avatar => avatar.getAttribute("data-mascot")))).toEqual(["cowboy", "princess", "robot"]);
  await expect(players.locator(".scene-name")).toHaveText(["Anthony", "Élise", "Raphaël"]);
  await expect(preview.getByTestId("preview-speech")).toHaveText(["A 5 for me.", "Hmm… maybe 8?", "Dude... I don't know!"]);
  for (const bubble of await preview.getByTestId("preview-speech").all()) await expect(bubble).toHaveCSS("border-radius", "16px");
  const cards = preview.getByTestId("preview-card");
  await expect(cards).toHaveCount(3);
  await expect(cards).toHaveText([/5$/u, /8$/u, /5$/u]);
  for (const card of await cards.all()) await expect(card).toHaveCSS("border-top-width", "1px");
  await expect(preview.getByText("Everyone has a seat at the table.", { exact: true })).toBeVisible();
  for (const text of ["Independent votes. Shared understanding.", "The next great conversation", "Live", "One link. Your whole team."]) {
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  }
});

test("landing conversation keeps its bubbles above the avatars and fits narrow screens", async ({ page }) => {
  await page.goto(routes.taskHoldemLanding);
  await page.evaluate(() => document.fonts.ready);
  const preview = page.getByTestId("task-holdem-preview");
  const viewport = page.viewportSize()!;
  for (const width of new Set([320, viewport.width])) {
    await page.setViewportSize({ width, height: viewport.height });
    const bounds = (await preview.boundingBox())!;
    let previousRight = bounds.x;
    for (const player of await preview.getByTestId("preview-player").all()) {
      const bubble = (await player.getByTestId("preview-speech").boundingBox())!;
      const mascot = (await player.locator("[data-mascot]").boundingBox())!;
      expect(bubble.y + bubble.height).toBeLessThan(mascot.y);
      expect(bubble.x).toBeGreaterThanOrEqual(previousRight);
      previousRight = bubble.x + bubble.width;
      for (const element of [player.getByTestId("preview-speech"), player.locator("[data-mascot]"), player.getByTestId("preview-card")]) {
        const box = (await element.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(bounds.x);
        expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});

test("landing conversation respects reduced motion and pauses outside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 600 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(routes.taskHoldemLanding);
  const preview = page.getByTestId("task-holdem-preview");
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute("data-running", "true");
  await expect(preview.getByTestId("preview-speech").first()).toHaveCSS("animation-play-state", "running");
  await expect(preview.locator("[data-mascot]").first()).toHaveAttribute("data-running", "true");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(preview).toHaveAttribute("data-running", "false");
  await expect(preview.getByTestId("preview-speech").first()).toHaveCSS("animation-play-state", "paused");
  await expect(preview.locator("[data-mascot]").first()).toHaveAttribute("data-running", "false");
  await expect(preview.locator("[data-mascot]").first()).toHaveAttribute("data-pose", "rest");
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(preview.getByTestId("preview-speech").first()).toHaveCSS("animation-name", "none");
  await expect(preview.locator("[data-mascot]").first()).toHaveAttribute("data-running", "false");
  await expect(preview.locator("[data-mascot]").first()).toHaveAttribute("data-pose", "rest");
});

test("landing introduction is centered below the desktop breakpoint", async ({ page }) => {
  await page.goto(routes.taskHoldemLanding);
  await page.evaluate(() => document.fonts.ready);
  const brand = page.getByRole("heading", { name: "TaskHold’em", level: 1 }).locator("..");
  const introduction = brand.locator("..");
  const viewport = page.viewportSize()!;
  for (const width of new Set([320, viewport.width])) {
    await page.setViewportSize({ width, height: viewport.height });
    const centered = width < 1024;
    await expect(introduction).toHaveCSS("text-align", centered ? "center" : "left");
    await expect(brand).toHaveCSS("justify-content", centered ? "center" : "flex-start");

    const bounds = await introduction.boundingBox();
    if (centered) {
      expect(bounds!.x + bounds!.width / 2).toBeCloseTo(width / 2, 0);
    }
    for (const element of [introduction.locator(":scope > p"), page.getByTestId("task-holdem-launch")]) {
      const elementBounds = await element.boundingBox();
      if (centered) {
        expect(elementBounds!.x + elementBounds!.width / 2).toBeCloseTo(bounds!.x + bounds!.width / 2, 0);
      } else {
        expect(elementBounds!.x).toBeCloseTo(bounds!.x, 0);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});

test("the specular launch keeps keyboard navigation when WebGL is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, type: string, options?: unknown) {
        if (type === "webgl2") return null;
        return Reflect.apply(getContext, this, [type, options]);
      },
    });
  });
  await page.goto(routes.taskHoldemLanding);
  const launch = page.getByRole("link", { name: "Start a planning session", exact: true });
  await expect(launch).toHaveAttribute("data-effect", "unavailable");
  await expect(launch).toHaveCSS("border-top-width", "1px");
  await launch.focus();
  await expect(launch).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(routes.taskHoldem);
  await expect(page.getByRole("button", { name: "Create room", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the specular launch animates without interaction, pauses and releases its WebGL context", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || isMobile, "Exercise real WebGL lifecycle once; every project covers the static fallback and navigation.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(routes.taskHoldemLanding);
  const launch = page.getByTestId("task-holdem-launch");
  const canvas = launch.locator("canvas");
  await expect(launch).toHaveAttribute("data-effect", "animated");
  await expect(canvas).toHaveCount(1);

  async function readAngle(): Promise<number | null> {
    return canvas.evaluate((element) => {
      if (!(element instanceof HTMLCanvasElement)) return null;
      const gl = element.getContext("webgl2");
      const program = gl?.getParameter(gl.CURRENT_PROGRAM);
      if (!gl || !program) return null;
      const location = gl.getUniformLocation(program, "uAngle");
      if (!location) return null;
      const value = gl.getUniform(program, location);
      return typeof value === "number" ? value : null;
    });
  }

  await expect.poll(readAngle).not.toBeNull();
  const initialAngle = await readAngle();
  await expect.poll(async () => {
    const angle = await readAngle();
    return angle !== null && angle !== initialAngle;
  }).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(launch).toHaveAttribute("data-effect", "static");
  const stillAngle = await readAngle();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await readAngle()).toBe(stillAngle);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(launch).toHaveAttribute("data-effect", "animated");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(launch).toHaveAttribute("data-effect", "static");
  await launch.scrollIntoViewIfNeeded();
  await expect(launch).toHaveAttribute("data-effect", "animated");

  const handle = await canvas.elementHandle();
  expect(handle).not.toBeNull();
  await launch.press("Enter");
  await expect(page).toHaveURL(routes.taskHoldem);
  expect(await handle!.evaluate(element => element.isConnected)).toBe(false);
  await expect.poll(() => handle!.evaluate(element => element instanceof HTMLCanvasElement && element.getContext("webgl2")?.isContextLost())).toBe(true);
});

test("layer assets keep their public URLs", async ({ request }) => {
  for (const path of ["/svg/task-holdem/logo.svg", "/svg/task-holdem/logo-light.svg", "/tools/task-holdem/notifications.js"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["content-type"]).toMatch(path.endsWith(".svg") ? /image\/svg\+xml/ : /(?:text|application)\/javascript/);
  }
});
