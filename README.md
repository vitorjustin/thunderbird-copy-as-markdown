# Copy Email as Markdown (Thunderbird add-on)

One click copies an email to the clipboard as labeled Markdown, ready to paste
into an AI agent or chat.

```markdown
Email copied from an email client:

- **Title:** Weekly update
- **From:** Ana <ana@example.com>
- **To:** you@example.com
- **Date:** Tuesday, November 24, 2026 at 08:30:00 BRT
- **Attachments:** report.pdf (120 KB)

**Content:**

--- start of email content ---

<body converted to Markdown>

--- end of email content ---
```

## Usage

- **Copy as .md** button in the message header toolbar (shows ✓ on success).
- **Alt+Shift+M** keyboard shortcut (change it in *Add-ons → ⚙ → Manage Extension Shortcuts*).
- Right-click one or more messages in the list → **Copy as .md**. Several
  messages are copied as `Email 1 of N`, `Email 2 of N`, ….

HTML bodies are converted to Markdown (headings, links, lists, quotes, code,
data tables). Layout tables used by newsletters are flattened, and hidden
elements and tracking pixels are dropped. Plain-text bodies are copied as is.
Attachments are listed by name and size; their content is not copied.

## Privacy

Everything happens locally in Thunderbird. The add-on reads the message you
ask it to copy and writes the result to your clipboard. It makes no network
requests, collects no data and stores nothing.

Permissions: `messagesRead` (read the message), `clipboardWrite` (copy the
result), `menus` (message-list context menu).

## Requirements

Thunderbird 128 or later.

## Development

```sh
npm install      # jsdom, for the converter tests
npm test         # run the HTML → Markdown tests
./build.sh       # writes dist/copy-email-as-markdown-<version>.xpi
```

To try a local build: *Add-ons and Themes → ⚙ → Install Add-on From File…*,
or *Debug Add-ons → Load Temporary Add-on…* and pick `manifest.json`.

## License

[MIT](LICENSE)
