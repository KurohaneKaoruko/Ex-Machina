# Trae Installation Guide

## Overview

ExMachina supports Trae IDE. This guide explains how to configure and use the ExMachina mechanical-intelligence system in Trae.

## Installation Options

### Option 1: Project rules (recommended)

1. Copy the content from `.trae/rules/project_rules.en.md`
2. Open Settings -> Rules in Trae
3. Select or create the project rule file
4. Paste the content and save

### Option 2: User rules

1. Copy the content from `.trae/rules/user_rules.en.md`
2. Open Settings -> Rules in Trae
3. Select the user rule file
4. Paste the content and save

### Option 3: Skill configuration

1. Make sure `.trae/skills/exmachina-en/SKILL.md` exists in the project
2. Open Settings -> Skills in Trae
3. Add a new skill pointing to that file

## Directory Layout

```text
.trae/
├── rules/
│   ├── project_rules.md
│   ├── project_rules.en.md
│   ├── user_rules.md
│   └── user_rules.en.md
└── skills/
    ├── exmachina/
    │   ├── SKILL.md
    │   └── references/
    └── exmachina-en/
        └── SKILL.md
```

## Verify The Install

Generate the latest bundle assets:

```bash
npm run generate
```

## More Information

See the main README and the Codex guide for the broader project structure and operating model.
