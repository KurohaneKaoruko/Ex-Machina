# ExMachina for Codex

ExMachina splits the Codex surface into three layers:

1. Install layer
`dist/codex/INSTALL*.md` and the root `scripts/setup-exmachina.*` files register the repository `skills/` directory into the local Codex skill library and sync `agents/` into `~/.codex/agents/`.

2. Bootstrap layer
`using-exmachina-zh` and `using-exmachina-en` help Codex recognize when a task should move into the stricter ExMachina workflow.

3. Core layer
`exmachina-zh` and `exmachina-en` carry the full mechanical-intelligence discipline: boundaries, evidence grading, conflict resolution, reversible execution, and verification closure.

## Recommended Usage

- Normal installers: follow `dist/codex/INSTALL.md` or `dist/codex/INSTALL.en.md` and install both skills and native agents.
- Power users: install a managed guidance block with `--install-guidance` / `-InstallGuidance` so `dist/codex/AGENTS.en.md` or `dist/codex/AGENTS.md` is written into `~/.codex/AGENTS.md`.
- Contributors: edit `src/`, then run `npm run generate && npm run verify`.

## Skill Responsibilities

### `using-exmachina-zh` / `using-exmachina-en`

These are the bootstrap surfaces. They:

- decide whether a task should enter ExMachina mode
- suggest the minimum sufficient route
- improve discipline on complex tasks without making simple tasks unnecessarily heavy

### `exmachina-zh` / `exmachina-en`

These are the full operating surfaces. Use them for:

- debugging and root-cause isolation
- implementation and refactoring
- verification and regression work
- code review, security review, and architecture review
- high-risk or high-uncertainty delivery work

## Why Split Bootstrap From Core

If there is only one large skill, two problems show up:

- simple tasks get pulled into an unnecessarily heavy process
- complex tasks do not always reliably trigger the strictest operating discipline

So ExMachina keeps bootstrap and core responsibilities separate:

- bootstrap skills handle discovery and activation
- core skills handle the full operating contract

## Agent Surface

The installer also syncs numbered agent files from `agents/` into the root `~/.codex/agents/` directory so Codex can treat them as native subagents.

If you also install the managed guidance block, Codex holds the ExMachina output stance more consistently:

- absolute rationality
- task priority
- affectless language

The installer keeps a manifest at:

- `~/.codex/agents/.exmachina-installed-agents.txt`

Only ExMachina-managed agent files are touched by that sync path.

Lifecycle commands:

- install: `bash ./scripts/setup-exmachina.sh`
- install always-on guidance: `bash ./scripts/setup-exmachina.sh --install-guidance --guidance-language en`
- verify: `bash ./scripts/setup-exmachina.sh --verify`
- uninstall: `bash ./scripts/setup-exmachina.sh --uninstall`
- remove always-on guidance: `bash ./scripts/setup-exmachina.sh --remove-guidance`
- PowerShell equivalents: `-InstallGuidance`, `-RemoveGuidance`, `-Verify`, and `-Uninstall`

## Key Paths

- `dist/codex/INSTALL.md`
- `dist/codex/INSTALL.en.md`
- `dist/codex/README.md`
- `dist/codex/README.en.md`
- `scripts/setup-exmachina.sh`
- `scripts/setup-exmachina.ps1`
- `agents/`
- `skills/using-exmachina-zh/SKILL.md`
- `skills/using-exmachina-en/SKILL.md`
- `skills/exmachina-zh/SKILL.md`
- `skills/exmachina-en/SKILL.md`
- `dist/codex/AGENTS.md`
- `dist/codex/AGENTS.en.md`

## Version And Source

- Repository: `{{REPOSITORY_URL}}`
- Raw install guide: `{{RAW_BASE_URL}}/dist/codex/INSTALL.en.md`
- Bundle version: `{{VERSION}}`
