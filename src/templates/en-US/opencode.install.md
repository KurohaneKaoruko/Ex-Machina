# ExMachina for OpenCode

ExMachina now ships a repository-native OpenCode plugin surface.

## Entry structure

- `package.json` points `main` to `.opencode/plugins/exmachina.mjs`
- the repository root exposes `.opencode/INSTALL.en.md`

OpenCode no longer needs a manual symlink for ExMachina. The plugin registers `skills/` at runtime and injects the ExMachina bootstrap into the system prompt.

## Install

Add this entry to the `plugin` array in `opencode.json`:

```json
{
  "plugin": [
    "exmachina@git+{{REPOSITORY_URL}}.git"
  ]
}
```

Then restart the OpenCode session.

## Language selection

The plugin chooses a bootstrap skill from the environment:

- if `LANG` / `LC_ALL` starts with `zh`, it defaults to the Chinese bootstrap
- otherwise it defaults to the English bootstrap

You can also force the choice:

```bash
EXMACHINA_LANG=zh
EXMACHINA_LANG=en
```

## Verification

Confirm that these entry files exist:

- `.opencode/plugins/exmachina.mjs`
- `skills/using-exmachina-zh/SKILL.md`
- `skills/using-exmachina-en/SKILL.md`

Then run a task that needs analysis plus execution. If the plugin is active, ExMachina should bias toward boundaries first, evidence second, execution third, without requiring a manual skill load.

## Related entrypoints

- Root OpenCode plugin entry: `.opencode/plugins/exmachina.mjs`
- Root install guide: `.opencode/INSTALL.en.md`
