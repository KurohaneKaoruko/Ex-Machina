# ExMachina for Gemini CLI

ExMachina now ships a native Gemini CLI extension surface:

- `gemini-extension.json` at the repository root
- `GEMINI.md` at the repository root
- supporting Gemini files under `.gemini/`

## Install

Install directly from the repository URL:

```bash
gemini extensions install https://github.com/KurohaneKaoruko/Ex-Machina
```

After installation, Gemini CLI reads:

- `gemini-extension.json`
- `GEMINI.md`

`GEMINI.md` then composes the shared ExMachina bootstrap plus Gemini-specific tool notes.

## Structure

The Gemini surface does not duplicate the full prompt system. It keeps the entry layer thin:

- `GEMINI.md` assembles the extension context
- `.gemini/gemini-tools.md` documents Gemini tool mapping and language rules
- `skills/using-exmachina-en/SKILL.md` remains the shared bootstrap logic

## Verification

Confirm that these files exist:

- `gemini-extension.json`
- `GEMINI.md`
- `.gemini/gemini-tools.md`
- `.gemini/INSTALL.en.md`

Then run a high-risk debugging or implementation task in Gemini CLI. If the extension surface is active, the output should more consistently:

- preserve unknowns
- insist on evidence-backed closure
- describe risk and verification points before execution

## Related entrypoints

- Root extension manifest: `gemini-extension.json`
- Root context file: `GEMINI.md`
- Root Gemini helper directory: `.gemini/`
