# ExMachina for Cursor

ExMachina now ships two Cursor entry surfaces:

- a repository-level plugin manifest at `.cursor-plugin/plugin.json`
- a rules fallback at `.cursor/rules/exmachina.mdc`

## Recommended path

Prefer installing the repository itself as a plugin source so Cursor can read `.cursor-plugin/plugin.json`. This is closer to a repository-native plugin flow than copying a rules file by hand because it exposes skills, agents, commands, and hooks in one surface.

If your current Cursor build does not yet expose a usable repository plugin flow, fall back to the generated `.mdc` rules files under `.cursor/rules/`.

## What the plugin manifest exposes

`.cursor-plugin/plugin.json` registers these paths:

- `../skills/`
- `../agents/`
- `../commands/`
- `./hooks.json`

## Repository install

Clone the repository first:

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina
```

Then point Cursor at the repository root so it can read:

```text
~/exmachina/.cursor-plugin/plugin.json
```

If your environment prefers Git-backed plugin sources, use the repository root as the plugin source. The important part is that Cursor resolves the root `.cursor-plugin/plugin.json`.

## Rules fallback

If plugin installation is not available yet, use the rules surface instead:

1. Open Cursor Rules
2. Paste `.cursor/rules/exmachina.mdc`
3. Use `.cursor/rules/exmachina-en.mdc` for an English-first workflow

## Verification

Confirm that these files exist:

- `.cursor-plugin/plugin.json`
- `.cursor-plugin/hooks.json`
- `.cursor/rules/exmachina.mdc`

Then run a task that needs analysis plus implementation. If the surface is loaded, the model should more consistently:

- lock boundaries before execution
- separate fact / inference / hypothesis / decision
- describe verification and rollback for high-risk actions

## Related entrypoints

- Root plugin manifest: `.cursor-plugin/plugin.json`
- Root plugin hooks: `.cursor-plugin/hooks.json`
- Chinese rules: `.cursor/rules/exmachina.mdc`
- English rules: `.cursor/rules/exmachina-en.mdc`
