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
  await expect(page.getByTestId("task-holdem-launch")).toHaveAttribute("data-auto-animate", "true");
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
