# ExMachina for OpenClaw

ExMachina ships a native installation surface for OpenClaw, wiring the pyramid-style multi-agent system into OpenClaw's workspace and native agent fleet mechanisms.

Raw installation doc URL:

- `{{RAW_BASE_URL}}/dist/openclaw/INSTALL.en.md`

## How integration works

OpenClaw integrates differently from the other platforms: there is no in-project rules directory. Everything centers on the gateway config (`~/.openclaw/openclaw.json`) and agent workspaces:

- `AGENTS.md` inside a workspace is injected at the start of every session
- the workspace `skills/` directory is the highest-precedence skill location
- the main session dispatches sub-agents via `sessions_spawn`; completion events flow back automatically
- sub-agent nesting depth is controlled by `agents.defaults.subagents.maxSpawnDepth`, default `1`; it must be raised to `2` explicitly to form the two-tier pyramid "conductor → link commander → sub-agents"

ExMachina provides two installation modes under `dist/openclaw/`:

| Mode | Mechanism | Use case |
|------|-----------|----------|
| lite (default) | workspace content install + sub-agent nesting config, adds no agent entries | a single primary agent doubles as the full-link conductor |
| full | registers `exmachina-main` plus 19 link commanders as native agent entries, each with its own workspace and role prompt | dedicated conductor agent, per-link memory and identity isolation |

The two modes are mutually exclusive; you can upgrade from lite to full later.

## Prerequisites

- An installed, reachable OpenClaw gateway (requires Node.js; the installer needs Node.js too)
- The `sessions_spawn` tool available in the main session (included in the default coding tool profile; see troubleshooting otherwise)
- No model or provider changes required: every ExMachina agent inherits the host default model

## Quick install

The repository can live anywhere. `~/exmachina` is used as the example path.

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina

# lite mode: workspace content install + two-tier sub-agent nesting
node scripts/apply-openclaw-settings.mjs

# full mode: additionally register the native agent fleet
node scripts/apply-openclaw-settings.mjs --mode full
```

What the script does:

- merges the `agents.defaults.subagents` nesting parameters into `~/.openclaw/openclaw.json` (backs up to `<target>.exmachina.bak` before writing)
- lite mode: copies the five skill directories from `skills/` into the workspace `skills/`, and writes the master agreement plus the OpenClaw dispatch protocol into workspace `AGENTS.md` as a managed block
- full mode: expands `{{EXMACHINA_PACK_ROOT}}` and deep-merges `agents.entries`, without touching channels, bindings, or model config

Common flags:

```bash
node scripts/apply-openclaw-settings.mjs --verify      # report install state, change nothing
node scripts/apply-openclaw-settings.mjs --uninstall   # remove managed content and entries
node scripts/apply-openclaw-settings.mjs --dry-run     # print the plan without writing
node scripts/apply-openclaw-settings.mjs --no-agents-md  # skip the AGENTS.md managed block in lite mode
node scripts/apply-openclaw-settings.mjs --target ~/.openclaw/openclaw.json --workspace ~/.openclaw/workspace
```

## What lite mode installs

After installation, the workspace contains:

```text
<workspace>/
├── AGENTS.md                 # existing content + ExMachina managed block (explicit markers)
└── skills/
    ├── exmachina-zh/         # Chinese core skill (with agents/protocol references)
    ├── exmachina-en/         # English core skill
    ├── using-exmachina-zh/   # Chinese light bootstrap
    ├── using-exmachina-en/   # English light bootstrap
    └── using-exmachina/      # bootstrap alias
```

The managed `agents.defaults.subagents` nesting parameters also appear in `~/.openclaw/openclaw.json`.

Usage: the primary agent receives tasks directly and dispatches sub-agents following the routing tiers in the master agreement; the sub-agent task text is assembled by the primary agent from the role prompts in `agents/` and `skills/exmachina-zh/references/agents/`. The two pyramid tiers map to:

- tier one (conductor): the current main session, doubling as the full-link conductor
- tier two (link commander → sub-agents): sub-agents spawned via `sessions_spawn`, with the task text naming the role and input

## What full mode installs

After installation, `agents.entries` in `~/.openclaw/openclaw.json` gains:

- `exmachina-main`: the full-link conductor, workspace at `<repo>/dist/openclaw/workspaces/exmachina-main`, allowed to dispatch all 19 link commanders
- `exmachina-link-<slug>` (19): each link commander, workspace at `<repo>/dist/openclaw/workspaces/exmachina-link-<slug>`, each loading its own role AGENTS.md

The in-repo `dist/openclaw/workspaces/` layout:

```text
dist/openclaw/workspaces/
├── exmachina-main/AGENTS.md            # full-link conductor + resource map and dispatch protocol
├── exmachina-link-knowledge/AGENTS.md  # knowledge link commander + appendix
├── exmachina-link-rationality/AGENTS.md
└── ... (20 workspaces total)
```

Ways to reach the conductor (pick one):

- switch to `exmachina-main` explicitly in the Control UI / session
- add bindings routing a channel account to `exmachina-main`
- spawn it from your own primary agent via `sessions_spawn` with `agentId: "exmachina-main"` (requires adding `exmachina-main` to that agent's `subagents.allowAgents`)

Note: after appending multiple agent entries to an existing config, OpenClaw routing becomes explicit (the previous implicit default routing may need a bindings fallback). Run `openclaw doctor` after installation to check routing and ownership, and `openclaw doctor --fix` when needed.

## Verify the install

```bash
node scripts/apply-openclaw-settings.mjs --verify
```

Or check manually:

- lite: workspace `AGENTS.md` contains `# >>> ExMachina managed block >>>`; `<workspace>/skills/exmachina-zh/SKILL.md` exists
- full: `agents.entries` in `~/.openclaw/openclaw.json` contains `exmachina-main` and `exmachina-link-knowledge`

Then send one of these tasks to the primary agent (or `exmachina-main`):

- "Analyze this error and give me a fix path"
- "Do a code review: list risks first, then summarize"

When the install is active, the agent locks the boundary and gathers evidence first, routes sub-agents by link body, and returns content tagged with `[role]:` markers and evidence grades.

## Update and uninstall

```bash
cd ~/exmachina
git pull --ff-only
node scripts/apply-openclaw-settings.mjs            # re-apply the current mode
node scripts/apply-openclaw-settings.mjs --uninstall
```

The script only manages ExMachina's own entries, managed blocks, and skill directories marked with `.exmachina-managed.txt`; it never removes unrelated content.

## Troubleshooting

- No `sessions_spawn` tool in the main session: set `tools.profile: "coding"` for the agent, or add `sessions_spawn` and `subagents` to `tools.allow`.
- Sub-agents cannot spawn their own sub-agents: confirm `agents.defaults.subagents.maxSpawnDepth` was merged as `2` (the default is `1`).
- Config merge errors: the script requires the target config to be valid JSON; run `openclaw doctor --fix` first, then retry. `--allow-missing` creates a minimal config when the target does not exist.
- Channel routing broken after full mode: a multi-agent fleet has no implicit default routing; add bindings for the previous agent or run `openclaw doctor --fix`.
- Custom gateway state directory: pass `--target` and `--workspace` explicitly.

## Related entry points

- Repository home: `{{REPOSITORY_URL}}`
- Fleet settings templates: `dist/openclaw/openclaw.settings.json` (full), `dist/openclaw/openclaw.settings.lite.json` (lite)
- Root `AGENTS.md`: the full master agreement
- Bundle entry point: `plugin.json`
