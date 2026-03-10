# Mission Loop

## Resource Arbitration

- Summary: Allocate resources for the mission "Consolidate knowledge handoff, terminology index, resource arbitration rules, and README examples to form an OpenClaw collaboration layer" from P0 to P3: close risk gates first, protect the primary chain, then support and deferred work.
- Priority slots:
  - P0 / Rationality Link Body: handle high-risk items, evidence conflicts, irreversible actions, and security/permission gates first.
  - P1 / Knowledge Link Body: keep the Knowledge Link Body primary delivery moving.
  - P2 / Documentation Link Body: handle integration, runbooks, instructions, and knowledge landing support work.
  - P3 / Knowledge Link Body: collect deferrable research, optimization, polish, or extension items.

## Execution Stages

### Stage 1 · Task Clarification
- Goal: provide fill-in inputs for terminology alignment, decision consolidation, index organization, and question logging.
- Owner link body: Knowledge Link Body
- Support link bodies: Rationality Link Body, Validation Link Body, Documentation Link Body, Security Link Body
- Exit checks:
  - Fill-in inputs are delivered to the owner per the handoff contract.
  - Fill-in conclusions do not exceed this link body's scope.

### Stage 2 · Primary Delivery
- Goal: the Knowledge Link Body produces the main deliverable.
- Owner link body: Knowledge Link Body
- Support link bodies: Rationality Link Body, Validation Link Body, Documentation Link Body, Security Link Body
- Exit checks:
  - Primary delivery is complete and traceable.
  - Key risks include rollback paths or alternatives.
  - Support link bodies have received the required fill-in inputs.

### Stage 3 · Cross-Validation
- Goal: the Rationality Link Body delivers evidence grading, counterevidence search, conflict arbitration, and confidence calibration.
- Owner link body: Rationality Link Body
- Support link bodies: Validation Link Body, Documentation Link Body, Security Link Body
- Exit checks:
  - Rationality Link Body outputs are structured and complete.
  - Risks, boundaries, and next actions are explicit.
  - Handoff outputs are directly consumable downstream.

### Stage 4 · Integration Handoff
- Goal: the Knowledge Link Body consolidates terminology, decisions, index, and open questions.
- Owner link body: Knowledge Link Body
- Support link bodies: Rationality Link Body, Validation Link Body, Documentation Link Body, Security Link Body
- Exit checks:
  - Knowledge Link Body outputs are structured and complete.
  - Risks, boundaries, and next actions are explicit.
  - Handoff outputs are directly consumable downstream.

## Handoff Contracts

### Handoff 1 · Stage 1 · Task Clarification → Stage 2 · Primary Delivery
- Producer link body: Knowledge Link Body
- Consumer link bodies: Knowledge Link Body, Rationality Link Body, Validation Link Body, Documentation Link Body, Security Link Body
- Acceptance checks:
  - Stage 1 exit checks are satisfied.
  - Stage 2 inputs are sufficient to achieve: the Knowledge Link Body produces the main deliverable.
  - Handoff content must separate confirmed facts, pending verification questions, and remaining risks.
  - Entry condition: the task boundary clearly requires this scope.

### Handoff 2 · Stage 2 · Primary Delivery → Stage 3 · Cross-Validation
- Producer link body: Knowledge Link Body
- Consumer link bodies: Rationality Link Body, Validation Link Body, Documentation Link Body, Security Link Body
- Acceptance checks:
  - Stage 2 exit checks are satisfied.
  - Stage 3 inputs are sufficient to achieve: the Rationality Link Body delivers evidence grading, counterevidence search, conflict arbitration, and confidence calibration.
  - Handoff content must separate confirmed facts, pending verification questions, and remaining risks.
  - Entry condition: the task boundary clearly requires this scope.

### Handoff 3 · Stage 3 · Cross-Validation → Stage 4 · Integration Handoff
- Producer link body: Rationality Link Body
- Consumer link bodies: Knowledge Link Body, Rationality Link Body, Validation Link Body, Documentation Link Body, Security Link Body
- Acceptance checks:
  - Stage 3 exit checks are satisfied.
  - Stage 4 inputs are sufficient to achieve: the Knowledge Link Body consolidates terminology, decisions, index, and open questions.
  - Handoff content must separate confirmed facts, pending verification questions, and remaining risks.
  - Entry condition: the task boundary clearly requires this scope.
  - Items that must be synced into knowledge handoff and long-term docs are explicit.

## Workflow

1. The Primary Conductor loads the Absolute Rationality Protocol and clarifies knowns, unknowns, assumptions, and acceptance criteria.
2. Dispatch the main task to the Knowledge Link Body.
3. The Knowledge Link Body conductor takes internal scheduling and loads member subagents.
4. Member subagents parallelize fact extraction, solution construction, risk analysis, evidence validation, and stage reporting.
5. The Knowledge Link Body conductor aggregates member results into the primary delivery.
6. Support link bodies (Rationality, Validation, Documentation, Security) execute counterevidence, validation, integration, or fill-in tasks.
7. Rationality Link Body performs evidence grading, counterevidence search, conflict arbitration, and confidence calibration.
8. Knowledge Link Body consolidates terminology, key decisions, reuse entry points, and open questions for a durable handoff.
9. Adjacent stages pass inputs and outputs via handoff contracts to avoid context loss.
10. When resources are contested, follow resource arbitration: risk gates first, then primary delivery.
11. The Primary Conductor outputs final conclusions, evidence summary, risk list, confidence, and next actions.

## Acceptance Criteria

- Global execution must follow the Absolute Rationality Protocol; all conclusions must distinguish facts, inferences, hypotheses, and decisions.
- The Knowledge Link Body owns delivery and must output actionable deliverables.
- Each link body must explicitly include one conductor and multiple subagents.
- Each conductor must handle member scheduling, conflict resolution, evidence consolidation, and stage aggregation.
- Lite mode does not create subagent agents in OpenClaw; subagent responsibilities are executed inline by the link body.
- The plan must include explicit execution stages, with goals, owner link bodies, deliverables, and exit checks for each stage.
- Adjacent stages must have explicit handoff contracts describing inputs, outputs, and acceptance criteria.
- The plan must include a resource-priority arbitration layer defining high-priority items, contention rules, and deferrable work.
- When evidence is insufficient, explicitly output unknowns, risks, and next verification steps; do not pretend certainty.
- All irreversible actions must include risk notes, rollback paths, or alternatives.
- Final output must satisfy the output contract and include evidence, judgments, risks, confidence, and next steps.
- Final output must include a knowledge handoff list with reusable artifacts, key decisions, open questions, and follow-up maintenance actions.
- Support link bodies include Rationality, Validation, Documentation, and Security, providing cross-fill support.
- Rationality Link Body must output counterevidence, evidence grading, conflict arbitration, and confidence calibration.
- Knowledge Link Body must output terminology, decisions, reusable paths, and unresolved questions.
- Security work must not be deprioritized below core delivery and evidence checks during contention.
- Reference the workspace stack: JSON, Markdown, Shell, TOML.
- Outputs must include executable verification steps, test plans, or evidence commands.
