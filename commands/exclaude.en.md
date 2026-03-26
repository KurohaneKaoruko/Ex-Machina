---
description: "ExMachina main entry point. Without arguments it routes through the mechanical-intelligence controller. Supports /excodex and /exclaude aliases."
argument-hint: "[analyze|route|implement|verify|audit|task description]"
---

Route based on the provided argument:

- no argument or direct task text: load the main `exmachina-en` skill and enter the global commander route
- `analyze`: prioritize research and rationality, collect context, evidence, and counter-evidence first
- `implement`: prioritize implementation, but do not skip evidence and boundary confirmation
- `verify`: prioritize verification, output assertions, evidence, and uncovered gaps
- `audit`: prioritize rationality, security, and review paths to find conflicts, counter-evidence, and weak conclusions

Execution rules:

1. Identify the route implied by the argument.
2. Default to English in this entry surface.
3. Prefer loading the shared `exmachina-en` skill rather than maintaining separate behavior descriptions per platform.
4. If the platform supports multi-agent coordination, dispatch through the layered structure; otherwise simulate the required roles serially in the current session.
