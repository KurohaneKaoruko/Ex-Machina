# Workspace and Collaboration Protocol

Goal: Define unified workspace rules for link bodies and member agents to avoid cross-chain contamination and state drift.

## Core Rules
- Each link body receives a workspace as its only write boundary.
- Member agents inside a link body must use the same workspace.
- For isolation, rollback, or temporary validation, create sub-workspaces inside the link body workspace.
- Sub-workspaces must be traceable, recyclable, and deletable; do not bypass the main workspace record requirements.

## Collaboration Constraints
- All cross-link-body deliveries must flow back through the Primary Conductor or a conductor.
- Any cross-chain write must annotate source link body and evidence level.
- Writing into another link body's workspace is forbidden without authorization.

## Output Requirements
- Outputs must annotate workspace scope.
- Outputs must distinguish facts, inferences, risks, and next steps.

## Failure Modes
- Workspace boundaries become mixed, making results untraceable.
- Sub-workspaces become uncontrolled, preventing rollback or reproduction.
