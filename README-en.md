# ExMachina

ExMachina is a mechanical-intelligence operating layer for AI coding tools. It focuses on evidence, explicit uncertainty, reversible execution, conflict resolution, and multi-agent routing instead of persona-driven prompting.

## What It Solves

Typical prompt packs fail in three ways:

- analysis, execution, and verification get mixed together
- the same behavior logic drifts across multiple platforms and install surfaces
- so-called multi-agent systems are often just a pile of personas without a stable routing or arbitration protocol

ExMachina hardens those points by:

- defining role boundaries with a layered structure
- defining coordination through explicit protocols instead of improvisation
- generating multiple install surfaces from a single source of truth
- forcing evidence, uncertainty, counter-evidence, and conflict resolution into the operating loop

## Core Model

ExMachina uses a layered routing model:

- top layer: the global commander
- middle layer: domain commanders
- lower layer: specialized execution units
- protocol layer: shared operating rules for evidence, arbitration, collaboration, and output contracts

Large tasks can route through the full layered structure. Medium tasks can stop at a domain commander. Small tasks can directly use a narrow specialist path.

## Bilingual User-Facing Surfaces

ExMachina now ships complete Chinese and English user-facing surfaces.

Direct interaction surfaces available in both languages include:

- bootstrap skills
- core skills
- Codex installation docs
- Codex usage guides
- command entry docs
- Trae installation and rule surfaces

Some lower-level prompts and internal references may remain single-language when that does not affect direct user interaction.

## Codex Install

ExMachina now ships a Codex-native installation surface.

- Chinese install guide: [`exmachina/codex/INSTALL.md`](exmachina/codex/INSTALL.md)
- English install guide: [`exmachina/codex/INSTALL.en.md`](exmachina/codex/INSTALL.en.md)
- Chinese Codex guide: [`exmachina/codex/README.md`](exmachina/codex/README.md)
- English Codex guide: [`exmachina/codex/README.en.md`](exmachina/codex/README.en.md)

Quick install:

```bash
mkdir -p ~/.codex
git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/.codex/exmachina-repo
cd ~/.codex/exmachina-repo
bash ./scripts/setup-exmachina.sh
```

## Repository Layout

```text
.
├─ src/                  # single source of truth
│  ├─ prompt/            # agents and protocols
│  └─ templates/         # zh-CN / en-US user-facing templates
├─ scripts/              # published installers plus development tooling
└─ exmachina/            # generated bundle surfaces for external tools
```

## Platform Surfaces

- Codex: `scripts/`, `exmachina/skills/`, and `exmachina/codex/`
- Trae: `exmachina/trae/`
- Cursor: `exmachina/cursor/`
- VS Code-style prompt surfaces: `exmachina/vscode/`
- Kiro: `exmachina/kiro/`
- Claude-style plugin surface: `exmachina/claude-plugin/`

## Contributor workflow

If you edit the source under `src/`, regenerate and verify the distributed surfaces:

```bash
npm install
npm run generate
npm run verify
```

## Current Status

Implemented:

- single-source build pipeline
- layered roles and protocol sources
- Codex-native installation surface
- Chinese and English user-facing skill and documentation surfaces
- generated multi-platform bundle outputs

Still worth expanding:

- stronger runtime routing behavior
- more complete evaluation and regression loops
- deeper platform-specific integration details

For the Chinese primary overview and the original architecture narrative, see [`README.md`](README.md).
