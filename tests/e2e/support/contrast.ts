import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
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
