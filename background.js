"use strict";

/* global htmlToMarkdown, tidyMarkdown */

const api = globalThis.messenger ?? globalThis.browser;

// ---------- message -> markdown ----------

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "long" }).format(new Date(date));
}

function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAttachmentPart(part) {
  const disp = part.headers?.["content-disposition"]?.[0] ?? "";
  return /^\s*attachment/i.test(disp);
}

function collectTextParts(part, out = []) {
  if (part.parts) for (const p of part.parts) collectTextParts(p, out);
  const ct = (part.contentType || "").toLowerCase();
  if ((ct === "text/plain" || ct === "text/html") && typeof part.body === "string" && !isAttachmentPart(part)) {
    out.push({ contentType: ct, content: part.body });
  }
  return out;
}

async function getTextParts(messageId) {
  // Decoded inline text parts, attachments already excluded. getFull is the
  // fallback for builds without listInlineTextParts or when it throws.
  if (api.messages.listInlineTextParts) {
    try {
      return await api.messages.listInlineTextParts(messageId);
    } catch (e) {
      console.warn("listInlineTextParts failed, falling back to getFull", e);
    }
  }
  return collectTextParts(await api.messages.getFull(messageId));
}

async function getBody(messageId) {
  const parts = await getTextParts(messageId);
  const html = parts.filter((p) => p.contentType === "text/html").map((p) => p.content);
  const plain = parts.filter((p) => p.contentType === "text/plain").map((p) => p.content);

  if (html.length) {
    const md = html.map(htmlToMarkdown).filter(Boolean).join("\n\n");
    if (md) return md;
  }
  return tidyMarkdown(plain.join("\n\n").replace(/\r\n/g, "\n"));
}

async function getAttachments(messageId) {
  try {
    return await api.messages.listAttachments(messageId);
  } catch {
    return [];
  }
}

async function messageToMarkdown(header, index, total) {
  const [body, attachments] = await Promise.all([getBody(header.id), getAttachments(header.id)]);

  const intro = total > 1
    ? `Email ${index + 1} of ${total}, copied from an email client:`
    : "Email copied from an email client:";

  const meta = [
    ["Title", header.subject || "(no subject)"],
    ["From", header.author],
    ["To", (header.recipients || []).join(", ")],
    ["Cc", (header.ccList || []).join(", ")],
    ["Bcc", (header.bccList || []).join(", ")],
    ["Date", formatDate(header.date)],
    ["Attachments", attachments.map((a) => `${a.name}${a.size != null ? ` (${formatSize(a.size)})` : ""}`).join(", ")],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `- **${k}:** ${v}`)
    .join("\n");

  // Explicit start/end markers so the agent can tell where the email ends and
  // the rest of the conversation resumes.
  return [
    intro,
    meta,
    "**Content:**",
    "--- start of email content ---",
    body || "(empty)",
    "--- end of email content ---",
  ].join("\n\n") + "\n";
}

async function messagesToMarkdown(headers) {
  const docs = [];
  for (const [i, h] of headers.entries()) docs.push(await messageToMarkdown(h, i, headers.length));
  return docs.join("\n\n");
}

// ---------- resolving which messages to copy ----------

async function drainList(list) {
  // MessageList pages: { id, messages } — older APIs may return a plain array.
  if (Array.isArray(list)) return list;
  if (!list) return [];
  const all = [...list.messages];
  let page = list;
  while (page.id) {
    page = await api.messages.continueList(page.id);
    all.push(...page.messages);
  }
  return all;
}

async function getMessagesForTab(tab) {
  const shown = await drainList(await api.messageDisplay.getDisplayedMessages(tab.id));
  if (shown.length) return shown;
  if (tab.type === "mail") {
    return drainList(await api.mailTabs.getSelectedMessages(tab.id));
  }
  return [];
}

// ---------- copy + feedback ----------

async function flashBadge(tabId, text, color) {
  if (tabId == null) return;
  try {
    await api.messageDisplayAction.setBadgeBackgroundColor({ tabId, color });
    await api.messageDisplayAction.setBadgeText({ tabId, text });
    setTimeout(() => api.messageDisplayAction.setBadgeText({ tabId, text: null }).catch(() => {}), 1500);
  } catch {
    // tab closed or no action button in this tab
  }
}

async function copyMessages(headers, tabId) {
  try {
    if (!headers.length) throw new Error("No message displayed or selected");
    await navigator.clipboard.writeText(await messagesToMarkdown(headers));
    await flashBadge(tabId, "✓", "#2e7d32");
  } catch (e) {
    console.error("Copy as Markdown failed:", e);
    await flashBadge(tabId, "!", "#c62828");
  }
}

// ---------- entry points ----------
// MV3 background is a non-persistent event page: listeners must be registered
// synchronously at top level, and menu items persist, so create them once.

api.runtime.onInstalled.addListener(() => {
  api.menus.create({
    id: "copy-as-markdown",
    title: "Copy as .md",
    contexts: ["message_list"],
  });
});

api.messageDisplayAction.onClicked.addListener(async (tab) => {
  copyMessages(await getMessagesForTab(tab), tab.id);
});

api.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "copy-as-markdown") return;
  tab ??= (await api.tabs.query({ active: true, currentWindow: true }))[0];
  if (tab) copyMessages(await getMessagesForTab(tab), tab.id);
});

api.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "copy-as-markdown") return;
  copyMessages(await drainList(info.selectedMessages), tab?.id);
});
