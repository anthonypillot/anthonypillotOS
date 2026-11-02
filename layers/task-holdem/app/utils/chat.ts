import { LinkifyIt } from "linkify-it";

export type TaskHoldemChatPart = { text: string; href?: string };

const linkify = new LinkifyIt({ fuzzyLink: true, fuzzyEmail: false, maxLength: 2000 });

export function getTaskHoldemChatParts(content: string): TaskHoldemChatPart[] {
  const parts: TaskHoldemChatPart[] = [];
  let cursor = 0;

  for (const link of linkify.match(content) ?? []) {
    let url: URL;
    try {
      url = new URL(link.url.startsWith("//") ? `https:${link.url}` : link.url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (!link.schema) url.protocol = "https:";

    if (link.index > cursor) parts.push({ text: content.slice(cursor, link.index) });
    parts.push({ text: content.slice(link.index, link.lastIndex), href: url.href });
    cursor = link.lastIndex;
  }

  if (cursor < content.length) parts.push({ text: content.slice(cursor) });
  return parts;
}
