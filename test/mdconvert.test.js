"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

// Load mdconvert.js the way Thunderbird does: as a plain script in a window.
// (Not window.eval: strict-mode eval would keep its declarations private.)
const { window } = new JSDOM("", { runScripts: "dangerously" });
const script = window.document.createElement("script");
script.textContent = fs.readFileSync(path.join(__dirname, "..", "mdconvert.js"), "utf8");
window.document.head.append(script);
const md = (html) => window.htmlToMarkdown(html);

test("inline formatting and links", () => {
  assert.equal(
    md('<p>Hi <b>Ana</b>, see the <a href="https://x.com/doc">doc</a> or <a href="mailto:a@b.com">a@b.com</a>.</p>'),
    "Hi **Ana**, see the [doc](https://x.com/doc) or <a@b.com>.",
  );
});

test("line breaks inside a paragraph", () => {
  assert.equal(md("<p>line one<br>line two</p>"), "line one\nline two");
});

test("nested lists keep indentation", () => {
  assert.equal(
    md("<ul><li>One</li><li>Two<ol><li>a</li><li>b</li></ol></li></ul>"),
    "- One\n- Two\n  1. a\n  2. b",
  );
});

test("data tables become Markdown tables with escaped pipes", () => {
  assert.equal(
    md("<table><tr><th>Name</th><th>Qty</th></tr><tr><td>Apples | red</td><td>3</td></tr></table>"),
    "| Name | Qty |\n| --- | --- |\n| Apples \\| red | 3 |",
  );
});

test("layout tables are flattened into blocks", () => {
  assert.equal(
    md('<table role="presentation"><tr><td><h1>Title</h1></td><td><p>Body</p></td></tr></table>'),
    "# Title\n\nBody",
  );
});

test("blockquotes and code blocks", () => {
  assert.equal(
    md("<blockquote><p>On Mon wrote:</p><p>quoted</p></blockquote><pre>a  b\n  c</pre>"),
    "> On Mon wrote:\n>\n> quoted\n\n```\na  b\n  c\n```",
  );
});

test("drops hidden content, styles and tracking pixels", () => {
  assert.equal(
    md('<style>p{}</style><p>kept</p><div style="display: none">hidden</div><img src="https://t/p.gif">'),
    "kept",
  );
});

test("keeps images that have alt text", () => {
  assert.equal(md('<img src="https://x/logo.png" alt="Logo">'), "![Logo](https://x/logo.png)");
  assert.equal(md('<img src="cid:123" alt="Chart">'), "[image: Chart]");
});
