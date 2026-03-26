# ExMachina for Codex

ExMachina now ships a Codex-native install surface so you can attach both this repository's `skills/` and `agents/` surfaces directly to local Codex.

Raw install guide:

- `{{RAW_BASE_URL}}/.codex/INSTALL.en.md`

## What You Get

After installation, Codex gets three entry layers:

- `using-exmachina-zh`: Chinese bootstrap entry
- `using-exmachina-en`: English bootstrap entry
- `exmachina-zh`: full Chinese operating surface
- `exmachina-en`: full English operating surface
- a native numbered agent set mirrored from `agents/` into `~/.codex/agents/`

If you want Codex to hold the ExMachina stance consistently, do not stop at skills alone. Install the managed guidance block into `~/.codex/AGENTS.md`. That is the path that most strongly reinforces absolute rationality, task priority, and affectless language. The repository-side Codex surface now lives under `.codex/`.

## Quick Install

You can clone the repository anywhere. The examples below use `~/exmachina` / `$HOME/exmachina`.

### macOS / Linux

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina
bash ./scripts/setup-exmachina.sh
bash ./scripts/setup-exmachina.sh --install-guidance --guidance-language en
```

### Windows PowerShell

```powershell
git clone {{REPOSITORY_URL}} "$HOME/exmachina"
Set-Location "$HOME/exmachina"
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance -GuidanceLanguage en
```

The installer supports five modes:

- default install
- `bash ./scripts/setup-exmachina.sh --verify`
- `bash ./scripts/setup-exmachina.sh --uninstall`
- `bash ./scripts/setup-exmachina.sh --install-guidance --guidance-language en`
- `bash ./scripts/setup-exmachina.sh --remove-guidance`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Verify`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance -GuidanceLanguage en`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -RemoveGuidance`

## How It Works

The install script manages three surfaces:

- macOS / Linux: creates a link at `~/.codex/skills/exmachina -> <repo-root>/skills`
- Windows PowerShell: syncs a managed directory into `~/.codex/skills/exmachina` and writes `.exmachina-managed.txt`
- syncs numbered agent files from `agents/` into `~/.codex/agents/`
- maintains a manifest at `~/.codex/agents/.exmachina-installed-agents.txt`
- optionally writes `.codex/AGENTS.md` or `.codex/AGENTS.en.md` into a managed block inside `~/.codex/AGENTS.md`

The managed guidance block is wrapped by explicit markers:

- `# >>> ExMachina managed block >>>`
- `# <<< ExMachina managed block <<<`

The script only manages ExMachina-owned skill surfaces, agent files, and the managed guidance block. Unrelated entries are left alone.

The repository already contains generated, discoverable assets under `skills/` and `agents/`, so normal consumers do not need `npm install` or `npm run generate` first.

## Verify The Install

After installation, confirm these paths exist:

- `~/.codex/skills/exmachina/using-exmachina-en/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-en/SKILL.md`
- `~/.codex/agents/00_全连结指挥体.md`
- `~/.codex/agents/19_实作连结指挥体.md`
- `~/.codex/agents/69_编码体.md`
- `~/.codex/agents/.exmachina-installed-agents.txt`
- if always-on guidance is installed: `~/.codex/AGENTS.md`

Then restart the Codex session and try one of these prompts:

- "Analyze this error and give me a repair path."
- "Do a code review and list the risks before summarizing."
- "Implement this feature, but lock the boundaries and verification plan first."

If ExMachina is active, Codex should lean toward:

- clarifying boundaries before execution
- separating fact / inference / hypothesis / decision
- explaining verification and rollback paths before high-risk actions
- keeping output task-first and affectless instead of falling back to a chatty default tone

## Update

### macOS / Linux

```bash
cd ~/exmachina
git pull --ff-only
bash ./scripts/setup-exmachina.sh
bash ./scripts/setup-exmachina.sh --install-guidance --guidance-language en
```

### Windows PowerShell

```powershell
Set-Location "$HOME/exmachina"
git pull --ff-only
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance -GuidanceLanguage en
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
bash ./scripts/setup-exmachina.sh --remove-guidance
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -RemoveGuidance
Remove-Item "$HOME/exmachina" -Recurse -Force
```

If you need to remove things manually, use the steps below:

### macOS / Linux

```bash
bash ./scripts/setup-exmachina.sh --remove-guidance
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
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -RemoveGuidance
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
- If you want stronger always-on guidance, use `--install-guidance` / `-InstallGuidance` instead of copying text manually.
- English users should normally install `.codex/AGENTS.en.md` by passing `--guidance-language en` / `-GuidanceLanguage en`.

## Related Entry Points

- Repository: `{{REPOSITORY_URL}}`
- Codex guide: `.codex/README.en.md`
- English always-on guidance: `.codex/AGENTS.en.md`
- Bundle manifest: `plugin.json`
