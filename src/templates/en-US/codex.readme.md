# ExMachina for Codex

ExMachina splits the Codex surface into three layers:

1. Install layer
`exmachina/codex/INSTALL*.md` and the root `scripts/setup-exmachina.*` files register the repository `exmachina/skills/` directory into the local Codex skill library and sync `exmachina/agents/` into `~/.codex/agents/`.

2. Bootstrap layer
`using-exmachina-zh` and `using-exmachina-en` help Codex recognize when a task should move into the stricter ExMachina workflow.

3. Core layer
`exmachina-zh` and `exmachina-en` carry the full mechanical-intelligence discipline: boundaries, evidence grading, conflict resolution, reversible execution, and verification closure.

## Recommended Usage

- Normal installers: follow `exmachina/codex/INSTALL.md` or `exmachina/codex/INSTALL.en.md` and install both skills and native agents.
- Power users: also merge `exmachina/codex/AGENTS.md` into `~/.codex/AGENTS.md` or a project `AGENTS.md`.
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

The installer also syncs numbered agent files from `exmachina/agents/` into the root `~/.codex/agents/` directory so Codex can treat them as native subagents.

The installer keeps a manifest at:

- `~/.codex/agents/.exmachina-installed-agents.txt`

Only ExMachina-managed agent files are touched by that sync path.

Lifecycle commands:

- install: `bash ./scripts/setup-exmachina.sh`
- verify: `bash ./scripts/setup-exmachina.sh --verify`
- uninstall: `bash ./scripts/setup-exmachina.sh --uninstall`
- PowerShell equivalents: `-Verify` and `-Uninstall`

## Key Paths

- `exmachina/codex/INSTALL.md`
- `exmachina/codex/INSTALL.en.md`
- `exmachina/codex/README.md`
- `exmachina/codex/README.en.md`
- `scripts/setup-exmachina.sh`
- `scripts/setup-exmachina.ps1`
- `exmachina/agents/00_全连结指挥体.md`
- `exmachina/agents/19_实作连结指挥体.md`
- `exmachina/agents/69_编码体.md`
- `exmachina/skills/using-exmachina-zh/SKILL.md`
- `exmachina/skills/using-exmachina-en/SKILL.md`
- `exmachina/skills/exmachina-zh/SKILL.md`
- `exmachina/skills/exmachina-en/SKILL.md`
- `exmachina/codex/AGENTS.md`

## Version And Source

- Repository: `{{REPOSITORY_URL}}`
- Raw install guide: `{{RAW_BASE_URL}}/exmachina/codex/INSTALL.en.md`
- Bundle version: `{{VERSION}}`
