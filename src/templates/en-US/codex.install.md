# ExMachina for Codex

ExMachina now ships a Codex-native install surface so you can attach this repository's `exmachina/skills/` directory directly to your local Codex skill library.

Raw install guide:

- `{{RAW_BASE_URL}}/exmachina/codex/INSTALL.en.md`

## What You Get

After installation, Codex can discover these skills:

- `using-exmachina-zh`: Chinese bootstrap entry
- `using-exmachina-en`: English bootstrap entry
- `exmachina-zh`: full Chinese operating surface
- `exmachina-en`: full English operating surface

If you want stronger always-on behavior, you can also merge `exmachina/codex/AGENTS.md` into your own `~/.codex/AGENTS.md` or project-level `AGENTS.md`.

## Quick Install

You can clone the repository anywhere. The examples below use `~/exmachina` / `$HOME/exmachina`.

### macOS / Linux

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina
bash ./scripts/setup-exmachina.sh
```

### Windows PowerShell

```powershell
git clone {{REPOSITORY_URL}} "$HOME/exmachina"
Set-Location "$HOME/exmachina"
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
```

## How It Works

The install script creates this local link:

- `~/.codex/skills/exmachina -> <repo-root>/exmachina/skills`
- Example: `~/.codex/skills/exmachina -> ~/exmachina/exmachina/skills`

The repository already contains generated, discoverable assets under `exmachina/skills/`, so normal consumers do not need `npm install` or `npm run generate` first.

## Verify The Install

After installation, confirm these paths exist:

- `~/.codex/skills/exmachina/using-exmachina-en/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-en/SKILL.md`

Then restart the Codex session and try one of these prompts:

- "Analyze this error and give me a repair path."
- "Do a code review and list the risks before summarizing."
- "Implement this feature, but lock the boundaries and verification plan first."

If ExMachina is active, Codex should lean toward:

- clarifying boundaries before execution
- separating fact / inference / hypothesis / decision
- explaining verification and rollback paths before high-risk actions

## Update

### macOS / Linux

```bash
cd ~/exmachina
git pull --ff-only
bash ./scripts/setup-exmachina.sh
```

### Windows PowerShell

```powershell
Set-Location "$HOME/exmachina"
git pull --ff-only
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
```

If you edited the source under `src/` instead of only consuming generated assets, also run:

```bash
npm install
npm run generate
npm run verify
```

## Uninstall

Delete the skill link, then remove the repository:

### macOS / Linux

```bash
rm ~/.codex/skills/exmachina
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
Remove-Item "$HOME/.codex/skills/exmachina" -Force
Remove-Item "$HOME/exmachina" -Recurse -Force
```

## Troubleshooting

- If `~/.codex/skills/exmachina` already exists and is not a link, the installer stops instead of deleting it. Remove it manually or rerun with `--force` / `-Force` if replacement is intended.
- If you install under a custom Codex home, set `CODEX_HOME` or pass `--codex-home` / `-CodexHome`.
- If you want stronger always-on guidance, merge `exmachina/codex/AGENTS.md` into your own `AGENTS.md`.

## Related Entry Points

- Repository: `{{REPOSITORY_URL}}`
- Codex guide: `exmachina/codex/README.en.md`
- Bundle manifest: `exmachina/plugin.json`
