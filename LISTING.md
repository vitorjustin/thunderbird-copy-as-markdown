# ATN listing copy

Paste these into the addons.thunderbird.net submission form.

- **Category:** Message and News Reading
- **License:** MIT
- **Homepage / support site:** https://github.com/vitorjustin/thunderbird-copy-as-markdown
- **Support:** https://github.com/vitorjustin/thunderbird-copy-as-markdown/issues
- **Tags:** markdown, clipboard, copy, ai, llm, export

## English

**Summary** (max 250 chars)

Copy any email as labeled Markdown (subject, sender, recipients, date, attachments and body) with one click, ready to paste into ChatGPT, Claude or any AI agent.

**Description**

Want an AI agent to read an email? Click **Copy as .md** and paste.

The add-on copies the open email to your clipboard as clean Markdown, with every piece labeled so the agent knows what it is reading:

- Title, From, To, Cc, Date and attachment names
- The body converted to Markdown: headings, links, lists, quotes, code and tables
- Clear start and end markers around the email content

Three ways to copy:

- The **Copy as .md** button above the open message
- The **Alt+Shift+M** shortcut
- Right-click one or more messages in the list → **Copy as .md**

Newsletter layout tables are flattened, and hidden text and tracking pixels are left out, so the agent gets the content, not the clutter.

**Privacy:** everything runs locally. No network requests, no data collection, nothing stored. The add-on only reads the message you choose to copy.

## Português (pt-BR)

**Resumo**

Copie qualquer e-mail como Markdown rotulado (assunto, remetente, destinatários, data, anexos e corpo) com um clique, pronto para colar no ChatGPT, Claude ou qualquer agente de IA.

**Descrição**

Quer que um agente de IA leia um e-mail? Clique em **Copy as .md** e cole.

O complemento copia o e-mail aberto para a área de transferência como Markdown limpo, com cada informação rotulada para o agente saber o que está lendo:

- Título, remetente, destinatários, Cc, data e nomes dos anexos
- O corpo convertido para Markdown: títulos, links, listas, citações, código e tabelas
- Marcadores claros de início e fim do conteúdo do e-mail

Três formas de copiar:

- O botão **Copy as .md** acima da mensagem aberta
- O atalho **Alt+Shift+M**
- Clique direito em uma ou mais mensagens da lista → **Copy as .md**

Tabelas de layout de newsletters são achatadas, e textos ocultos e pixels de rastreamento são descartados.

**Privacidade:** tudo roda localmente. Nenhuma requisição de rede, nenhuma coleta de dados, nada é armazenado. O complemento lê apenas a mensagem que você escolher copiar.

## Notes for reviewers

No build step, no minified or third-party code. The .xpi contains exactly the
files in the repository root: `manifest.json`, `background.js`, `mdconvert.js`,
`icon.svg`. The HTML → Markdown conversion uses `DOMParser` on the message body
and never inserts the parsed content into a live document.

## Screenshots

`store/screenshot-{1,2,3}.png` (1280×800): the button, the pasted result in an
AI chat, and the message-list context menu. They are illustrations rendered
from `store/shots.html`; the pasted text in `store/pasted.js` is real output of
the converter. To re-render after editing:

```sh
for s in 1 2 3; do
  google-chrome --headless=new --hide-scrollbars --window-size=1280,800 \
    --virtual-time-budget=4000 --screenshot="store/screenshot-$s.png" \
    "file://$PWD/store/shots.html#s$s"
done
```
