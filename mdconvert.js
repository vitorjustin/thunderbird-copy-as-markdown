"use strict";

// Minimal HTML -> Markdown converter tuned for email bodies (read by an LLM,
// so readability beats perfect round-tripping).

const SKIP_TAGS = new Set(["script", "style", "head", "title", "meta", "link", "noscript", "template"]);
const BLOCK_TAGS = new Set([
  "p", "div", "section", "article", "header", "footer", "main", "aside",
  "center", "address", "figure", "figcaption", "details", "summary", "form", "fieldset",
]);

function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return tidyMarkdown(convertChildren(doc.body, { pre: false }));
}

function convertChildren(node, ctx) {
  let out = "";
  for (const child of node.childNodes) out += convertNode(child, ctx);
  return out;
}

function block(text) {
  const t = text.trim();
  return t ? `\n\n${t}\n\n` : "\n";
}

function wrapInline(text, mark) {
  if (!text.trim()) return text;
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return `${m[1]}${mark}${m[2]}${mark}${m[3]}`;
}

function convertNode(node, ctx) {
  if (node.nodeType === Node.TEXT_NODE) {
    return ctx.pre ? node.data : node.data.replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return "";
  if (node.hidden || /display\s*:\s*none/i.test(node.getAttribute("style") || "")) return "";

  const inner = () => convertChildren(node, ctx);

  if (BLOCK_TAGS.has(tag)) return block(inner());

  switch (tag) {
    case "br":
      return "\n";
    case "hr":
      return "\n\n---\n\n";
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
      const text = inner().replace(/\s+/g, " ").trim();
      return text ? `\n\n${"#".repeat(Number(tag[1]))} ${text}\n\n` : "";
    }
    case "strong": case "b":
      return wrapInline(inner(), "**");
    case "em": case "i":
      return wrapInline(inner(), "*");
    case "s": case "strike": case "del":
      return wrapInline(inner(), "~~");
    case "code":
      return ctx.pre ? node.textContent : wrapInline(node.textContent, "`");
    case "pre":
      return `\n\n\`\`\`\n${node.textContent.replace(/\n+$/, "")}\n\`\`\`\n\n`;
    case "a":
      return convertLink(node, inner());
    case "img":
      return convertImage(node);
    case "ul": case "ol":
      return convertList(node, tag === "ol", ctx);
    case "li": // stray <li> outside a list
      return block(`- ${inner().trim()}`);
    case "blockquote": {
      const text = tidyMarkdown(inner());
      if (!text) return "";
      return `\n\n${text.split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n")}\n\n`;
    }
    case "table":
      return convertTable(node, ctx);
    default:
      return inner();
  }
}

function convertLink(node, text) {
  const href = (node.getAttribute("href") || "").trim();
  const label = text.replace(/\s+/g, " ").trim();
  if (!label) return "";
  if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:")) return text;
  const bare = href.replace(/^mailto:/i, "");
  if (label === href || label === bare) return `<${bare}>`;
  return `[${label}](${href})`;
}

function convertImage(node) {
  const alt = (node.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
  const src = node.getAttribute("src") || "";
  if (!alt) return ""; // tracking pixels, spacers, decorative images
  return /^https?:/i.test(src) ? `![${alt}](${src})` : `[image: ${alt}]`;
}

function convertList(node, ordered, ctx) {
  let n = Number(node.getAttribute("start")) || 1;
  const items = [];
  for (const li of node.children) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const prefix = ordered ? `${n++}. ` : "- ";
    const pad = " ".repeat(prefix.length);
    const body = tidyMarkdown(convertChildren(li, ctx)).replace(/\n{2,}/g, "\n");
    items.push(prefix + body.split("\n").join(`\n${pad}`));
  }
  return items.length ? `\n\n${items.join("\n")}\n\n` : "";
}

// Emails abuse tables for layout. Only render "real" data tables as
// Markdown tables; flatten everything else into blocks.
function convertTable(table, ctx) {
  const rows = Array.from(table.rows);
  const maxCols = Math.max(0, ...rows.map((r) => r.cells.length));
  const isLayout =
    table.getAttribute("role") === "presentation" ||
    table.querySelector("table") !== null ||
    maxCols < 2 ||
    rows.length < 2;

  if (isLayout) {
    let out = "";
    for (const row of rows) for (const cell of row.cells) out += block(convertChildren(cell, ctx));
    return out;
  }

  const cellText = (cell) =>
    tidyMarkdown(convertChildren(cell, ctx)).replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");
  const lines = rows.map((row) => {
    const cells = Array.from(row.cells).map(cellText);
    while (cells.length < maxCols) cells.push("");
    return `| ${cells.join(" | ")} |`;
  });
  lines.splice(1, 0, `|${" --- |".repeat(maxCols)}`);
  return `\n\n${lines.join("\n")}\n\n`;
}

function tidyMarkdown(md) {
  return md
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, "").replace(/^ (?=\S)/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
