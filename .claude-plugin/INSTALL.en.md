# ExMachina for Claude Code

ExMachina now ships a Claude Code surface that is closer to a repository-native plugin model:

- repository root plugin metadata in `.claude-plugin/plugin.json`
- repository root development marketplace metadata in `.claude-plugin/marketplace.json`

## Design

The shared content still lives in a single place:

- `skills/`
- `agents/`
- `commands/`
- `hooks/`

Claude only gets a thin plugin layer that points at those shared surfaces.

## Install path

Clone the repository first:

```bash
git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/exmachina
cd ~/exmachina
```

If your Claude Code build supports repository plugins or a development marketplace flow, point it at the repository root so it reads:

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

## What gets wired in

The Claude plugin surface exposes these shared directories:

- `../commands`
- `../skills`
- `../agents`
- `../hooks`

## Verification

Confirm that these files exist:

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `.claude-plugin/INSTALL.en.md`

Then run a complex Claude Code task such as debugging, implementation plus verification, or code review. If the surface is active, the model should more consistently:

- collect boundaries first
- collect evidence before judgment
- separate fact / inference / hypothesis / decision
- avoid declaring completion before the verification loop closes

## Related entrypoints

- Root plugin manifest: `.claude-plugin/plugin.json`
- Root development marketplace: `.claude-plugin/marketplace.json`
- Root install guide: `.claude-plugin/INSTALL.en.md`
