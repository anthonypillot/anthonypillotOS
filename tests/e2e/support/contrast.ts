import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect } from "./fixtures";

export async function expectReadableContrast(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime));
    await Promise.all(animations.map(async (animation) => {
      try { await animation.finished; } catch { /* Opening another panel can cancel a transition. */ }
    }));
  });
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  const violations = results.violations.flatMap(violation => violation.nodes.map(node => ({
    target: node.target, html: node.html, failure: node.failureSummary,
  })));
  expect(violations, "Visible text must meet WCAG AA contrast on its rendered background").toEqual([]);
}

export async function readSurfaceContrast(locator: Locator, edge: "top" | "bottom" = "top") {
  return locator.evaluate((element, edge) => {
    type Color = readonly [number, number, number, number];
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is required to measure surface contrast.");

    function readColor(value: string): Color {
      context!.clearRect(0, 0, 1, 1);
      context!.fillStyle = value;
      context!.fillRect(0, 0, 1, 1);
      const data = context!.getImageData(0, 0, 1, 1).data;
      return [data[0]!, data[1]!, data[2]!, data[3]! / 255];
    }

    function composite(foreground: Color, background: Color): Color {
      const alpha = foreground[3];
      return [
        foreground[0] * alpha + background[0] * (1 - alpha),
        foreground[1] * alpha + background[1] * (1 - alpha),
        foreground[2] * alpha + background[2] * (1 - alpha),
        1,
      ];
    }

    function luminance(color: Color): number {
      const [red = 0, green = 0, blue = 0] = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    }

    function contrast(first: Color, second: Color): number {
      const lighter = Math.max(luminance(first), luminance(second));
      const darker = Math.min(luminance(first), luminance(second));
      return (lighter + 0.05) / (darker + 0.05);
    }

    const ancestors: Element[] = [];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) ancestors.unshift(ancestor);
    let parent: Color = [0, 0, 0, 1];
    for (const ancestor of ancestors) parent = composite(readColor(getComputedStyle(ancestor).backgroundColor), parent);
    const style = getComputedStyle(element);
    const background = composite(readColor(style.backgroundColor), parent);
    const border = composite(readColor(edge === "top" ? style.borderTopColor : style.borderBottomColor), background);
    const borderWidth = Number.parseFloat(edge === "top" ? style.borderTopWidth : style.borderBottomWidth);
    const outline = composite(readColor(style.outlineColor), background);
    return {
      background: contrast(background, parent),
      border: borderWidth > 0 ? Math.min(contrast(border, background), contrast(border, parent)) : 1,
      outline: Math.min(contrast(outline, background), contrast(outline, parent)),
    };
  }, edge);
}
