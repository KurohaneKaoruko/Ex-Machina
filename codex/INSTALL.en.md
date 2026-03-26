# ExMachina for Codex

ExMachina now ships a Codex-native install surface so you can attach both this repository's `skills/` and `agents/` surfaces directly to local Codex.

Raw install guide:

- `https://raw.githubusercontent.com/KurohaneKaoruko/Ex-Machina/main/codex/INSTALL.en.md`

## What You Get

After installation, Codex gets three entry layers:

- `using-exmachina-zh`: Chinese bootstrap entry
- `using-exmachina-en`: English bootstrap entry
- `exmachina-zh`: full Chinese operating surface
- `exmachina-en`: full English operating surface
- a native agent set: `00_全连结指挥体`, the `10-19` link commanders, and the `30-70` worker units, synced into `~/.codex/agents/`

If you want stronger always-on behavior, you can also merge `codex/AGENTS.md` into your own `~/.codex/AGENTS.md` or project-level `AGENTS.md`.

## Quick Install

You can clone the repository anywhere. The examples below use `~/exmachina` / `$HOME/exmachina`.

### macOS / Linux

```bash
git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/exmachina
cd ~/exmachina
bash ./scripts/setup-exmachina.sh
```

### Windows PowerShell

```powershell
git clone https://github.com/KurohaneKaoruko/Ex-Machina "$HOME/exmachina"
Set-Location "$HOME/exmachina"
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
```

The installer supports three modes:

- default install
- `bash ./scripts/setup-exmachina.sh --verify`
- `bash ./scripts/setup-exmachina.sh --uninstall`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Verify`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall`

## How It Works

The install script does two things:

- macOS / Linux: creates a link at `~/.codex/skills/exmachina -> <repo-root>/skills`
- Windows PowerShell: syncs a managed directory into `~/.codex/skills/exmachina` and writes `.exmachina-managed.txt`
- syncs numbered agent files from `agents/` into `~/.codex/agents/`
- maintains a manifest at `~/.codex/agents/.exmachina-installed-agents.txt`

The script only manages ExMachina-owned skill and agent surfaces and leaves unrelated entries alone.

The repository already contains generated, discoverable assets under `skills/` and `agents/`, so normal consumers do not need `npm install` or `npm run generate` first.

## Verify The Install

After installation, confirm these paths exist:

- `~/.codex/skills/exmachina/using-exmachina-en/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-en/SKILL.md`
- `~/.codex/agents/00_全连结指挥体.md`
- `~/.codex/agents/19_实作连结指挥体.md`
- `~/.codex/agents/69_编码体.md`
- `~/.codex/agents/.exmachina-installed-agents.txt`

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

Prefer using the installer in uninstall mode:

### macOS / Linux

```bash
bash ./scripts/setup-exmachina.sh --uninstall
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall
Remove-Item "$HOME/exmachina" -Recurse -Force
```

If you need to remove things manually, use the steps below:

### macOS / Linux

```bash
rm ~/.codex/skills/exmachina
if [ -f ~/.codex/agents/.exmachina-installed-agents.txt ]; then
  while IFS= read -r name; do
    rm -f "$HOME/.codex/agents/$name"
  done < ~/.codex/agents/.exmachina-installed-agents.txt
  rm -f ~/.codex/agents/.exmachina-installed-agents.txt
fi
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
Remove-Item "$HOME/.codex/skills/exmachina" -Force
if (Test-Path "$HOME/.codex/agents/.exmachina-installed-agents.txt") {
  Get-Content "$HOME/.codex/agents/.exmachina-installed-agents.txt" |
    Where-Object { $_ } |
    ForEach-Object { Remove-Item (Join-Path "$HOME/.codex/agents" $_) -Force -ErrorAction SilentlyContinue }
  Remove-Item "$HOME/.codex/agents/.exmachina-installed-agents.txt" -Force
}
Remove-Item "$HOME/exmachina" -Recurse -Force
```

## Troubleshooting

- If `~/.codex/skills/exmachina` already exists and is not a link, the installer stops instead of deleting it. Remove it manually or rerun with `--force` / `-Force` if replacement is intended.
- If a same-named file already exists under `~/.codex/agents/` and does not look managed by ExMachina, the installer stops. Remove it manually or rerun with `--force` / `-Force` if replacement is intended.
- If you only want to inspect the current installation state without changing files, use `--verify` / `-Verify`.
- If you install under a custom Codex home, set `CODEX_HOME` or pass `--codex-home` / `-CodexHome`.
- If you want stronger always-on guidance, merge `codex/AGENTS.md` into your own `AGENTS.md`.

## Related Entry Points

- Repository: `https://github.com/KurohaneKaoruko/Ex-Machina`
- Codex guide: `codex/README.en.md`
- Bundle manifest: `plugin.json`
