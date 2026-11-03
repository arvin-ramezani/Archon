# ImArvin supervised task delivery

## Approved delivery contract

One approved task is active at a time. The workflow accepts an existing GitHub issue or an approved task description. When there is no issue, it creates or reuses exactly one issue only after publication approval; independently deliverable outcomes may become linked sub-issues. The issue then continues automatically into mandatory planning unless an approved implementation plan is explicitly reused. Planning must return `ready: true` before implementation.

Implementation runs the applicable project checks and opens a pull request. Every implementation pull request and every code-changing correction receives an independent code review in a fresh, read-only context. Review evidence must name the exact commit SHA. A changed code head invalidates earlier review evidence.

Security risk is assessed using a versioned deterministic trigger table before delivery can pass. The exact trigger coverage matrix is a prerequisite for the dependent security-gate capability and is not invented by this routing change. Unknown classification or unavailable required evidence blocks. A required security review is a separate fresh, read-only review of the exact head. Critical or High findings block. Medium or Low findings require correction or explicit owner risk acceptance. Corrections trigger risk reassessment and every required review again. Retries are bounded; exhausted retries or unresolved owner decisions produce a blocked report, never a pass.

The workflow leaves the pull request for human approval. Scheduling, automatic merging, and deployment remain disabled.

## Role routing capability (this change)

The owner-controlled Archon fork owns the versioned shared workflow source. Every model-using SDLC node names a role alias and an exact guard. Planning uses `@imarvin-planning` (`codex`, `gpt-6.1-sol`, Medium); all other AI stages use `@imarvin-luna-high` (`codex`, `gpt-6-luna`, High). Deterministic nodes declare no model. Archon's run preflight resolves the effective configuration after repository, user, and run overrides and rejects a missing alias, mismatched alias target, mismatched reasoning effort, or missing node guard before credential checks or node execution. There is no tier or provider fallback for guarded nodes.

ImArvin stores the aliases in its project `.archon/config.yaml`; the global Archon configuration is not edited. ImArvin's `factory/pack.json` and generated `.factory/consumer.json` point at the same immutable owner-fork commit. Install/update through the factory's supported `python <factory-root>\bin\factory.py init --source https://github.com/arvin-ramezani/Archon.git --revision <40-character-sha>` command from the ImArvin root, then run `python factory/consumer.py doctor` and `python factory/consumer.py list`. No workflow copy or second orchestrator is introduced. A consuming project without these role aliases fails preflight before any AI stage starts.

Model availability is based on the already recorded successful Codex-through-Archon executions for Sol Medium and Luna High. This capability adds deterministic routing checks and does not make a live provider call.

## Dependent capabilities

These are required before the complete delivery contract is available and are intentionally not part of role routing:

1. A single native Archon entrypoint for approved task intake, issue lookup/publication approval, create-or-reuse semantics, issue handoff, resume behavior, and a durable one-active-task lock.
2. Mandatory planning and a typed `ready: true` gate, with provenance for an explicitly reused approved plan.
3. Mandatory independent code review for each PR and code-changing correction, with fresh contexts and exact-head evidence.
4. Deterministic security triggers, classification/escalation, security review freshness, and a fail-closed security verdict in the delivery loop.
5. Bounded correction and re-review transitions that invalidate stale code and security evidence.
6. An evidence-backed Markdown CTO report for both successful and blocked runs, including actual checks, reviewed head, risk decisions, remaining work, and explicitly unavailable evidence.

Each dependent capability needs its own tests for success, stale evidence, unavailable evidence, and blocked/owner-decision paths before a supervised pilot. None should enable scheduling, merging, or deployment.
