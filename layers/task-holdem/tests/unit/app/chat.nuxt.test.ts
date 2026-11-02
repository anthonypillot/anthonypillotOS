import { mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, test } from "vitest";
import Chat from "../../../app/components/task-holdem/Chat.vue";
import { getTaskHoldemChatParts } from "../../../app/utils/chat";
import type { TaskHoldemMessage } from "../../../shared/types/room.type";

const cleanup: (() => void)[] = [];

async function mountChat(content: string) {
  const message = {
    id: "message-1", roomId: "room-1", participantId: "alice", author: { name: "Alice", avatar: "cowboy" },
    content, createdAt: 1000,
  } satisfies TaskHoldemMessage;
  const wrapper = await mountSuspended(Chat, { props: { messages: [message], disabled: false, sending: false } });
  cleanup.push(() => wrapper.unmount());
  await wrapper.get("button").trigger("click");
  return wrapper;
}

afterEach(() => { while (cleanup.length) cleanup.pop()?.(); });

describe("Task Hold'em chat links", () => {
  test.each([
    ["https://example.com/ticket/42", "https://example.com/ticket/42"],
    ["http://example.com/help", "http://example.com/help"],
    ["www.example.com/docs", "https://www.example.com/docs"],
    ["example.org", "https://example.org/"],
    ["//example.com/docs", "https://example.com/docs"],
    ["https://example.com/path?a=1&b=2#estimate", "https://example.com/path?a=1&b=2#estimate"],
    ["http://localhost:4173/tools", "http://localhost:4173/tools"],
    ["https://[::1]:4173/tools", "https://[::1]:4173/tools"],
  ])("recognizes %s as a safe web link", (text, href) => {
    expect(getTaskHoldemChatParts(text)).toEqual([{ text, href }]);
  });

  test.each([
    "Ready to estimate?", "javascript:alert(1)", "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)", "file:///etc/passwd", "ftp://files.example.com/readme", "mailto:alice@example.com", "alice@example.com", "https://",
  ])("keeps unsupported or invalid content as text: %s", (text) => {
    expect(getTaskHoldemChatParts(text)).toEqual([{ text }]);
  });

  test("does not link punctuation after a URL and preserves balanced parentheses", () => {
    const first = "https://example.com/ticket/42";
    const second = "https://en.wikipedia.org/wiki/Planning_poker_(software)";
    expect(getTaskHoldemChatParts(`See (${first}). Then ${second}!`)).toEqual([
      { text: "See (" }, { text: first, href: first }, { text: "). Then " }, { text: second, href: second }, { text: "!" },
    ]);
  });

  test("preserves Unicode, line breaks and text around multiple links", () => {
    const content = "🚀 Review https://example.com/path?a=1&b=2#estimate\n  Then www.example.org/docs. ✅";
    const parts = getTaskHoldemChatParts(content);
    expect(parts.map(part => part.text).join("")).toBe(content);
    expect(parts.flatMap(part => part.href ? [part.href] : [])).toEqual([
      "https://example.com/path?a=1&b=2#estimate", "https://www.example.org/docs",
    ]);
  });

  test("keeps ignored protocols intact before a valid web URL", () => {
    expect(getTaskHoldemChatParts("ftp://files.example.com/readme then https://example.com/docs")).toEqual([
      { text: "ftp://files.example.com/readme then " }, { text: "https://example.com/docs", href: "https://example.com/docs" },
    ]);
    expect(getTaskHoldemChatParts("")).toEqual([]);
  });

  test("renders links as safe anchors without changing the visible message", async () => {
    const content = "🚀 See (https://example.com/ticket/42).\nThen www.example.org/docs.";
    const wrapper = await mountChat(content);
    const body = wrapper.get("[role='log'] p");
    expect(body.element.textContent).toBe(content);
    const links = body.findAll("a");
    expect(links).toHaveLength(2);
    expect(links.map(link => link.attributes("href"))).toEqual(["https://example.com/ticket/42", "https://www.example.org/docs"]);
    for (const link of links) {
      expect(link.attributes("target")).toBe("_blank");
      expect(link.attributes("rel")).toBe("noopener noreferrer");
      expect(link.attributes("aria-label")).toBe(`${link.text()} (opens in a new tab)`);
    }
  });

  test("never interprets message HTML or dangerous protocols", async () => {
    const content = '<img src=x onerror="alert(1)"><script>alert(1)</script> javascript:alert(1) https://example.com/safe';
    const wrapper = await mountChat(content);
    const body = wrapper.get("[role='log'] p");
    expect(body.element.textContent).toBe(content);
    expect(body.findAll("img, script, iframe, [onerror]")).toHaveLength(0);
    expect(body.findAll("a").map(link => link.attributes("href"))).toEqual(["https://example.com/safe"]);
  });
});
