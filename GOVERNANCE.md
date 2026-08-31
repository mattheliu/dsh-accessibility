# Project governance

[简体中文](GOVERNANCE.zh.md) | English

`dsh-accessibility` is the public project hub and runtime companion of the [DSH Accessibility Working Group](https://github.com/omdsh-dev/community/blob/main/working-groups/accessibility.md). Organization-wide governance, conduct, and contributor access follow the [`omdsh-dev/community`](https://github.com/omdsh-dev/community) policies. This document defines the narrower technical and evidence rules for this repository.

## Mission

Enable disabled developers to complete DSH's core tasks independently, effectively, and safely; help every developer produce more accessible digital content with DSH; and continuously validate both goals with versioned standards, real assistive technology, and evidence from disabled users.

## Product boundaries

- **DSH core owns required default behavior:** semantics, focus lifecycle, keyboard operation, status announcements, reflow, forced colors, reduced motion, error recovery, and startup/CLI behavior.
- **This companion owns additive experience:** accessibility help, diagnostics, versioned compatibility information, an optional Accessible View, user-controlled signals, and redacted evidence export.
- **Developer tooling is separated when code begins:** deterministic testkit code gets its own development-only release boundary; native AT drivers get their own OS-specific boundary; model-visible authoring tools get their own permission boundary.
- A runtime plugin must not repair the owning UI by observing generated classes or rewriting roles, focus, or keyboard behavior after render.

## Decisions

- Routine, reversible repository changes use maintainer review and recorded tests.
- A support claim, evidence badge, compatibility-range expansion, stable release, data collection, new permission, or repository split requires a public issue or proposal with scope, evidence, owner, rollback, and review date.
- Security, conduct, participant data, credentials, private conversations, and unredacted recordings use private routes and never pass by silence.
- The working group aims for consensus. A substantive unresolved objection pauses a support claim or high-impact change; the relevant repository or organization controller makes the final scoped decision.

## Evidence and releases

Support is always scoped to exact product, operating-system, browser, language, configuration, and any assistive-technology versions used. Automated DOM or accessibility-tree checks are evidence, not screen-reader certification.

Public evidence levels are:

1. `a11y-automated-reviewed` — deterministic automated gates passed.
2. `a11y-at-tested` — named browser/AT combinations completed the published scenarios.
3. `a11y-user-validated` — consented disabled participants completed representative tasks.

Evidence expires when an affected DSH minor line, browser/AT behavior, or relevant UI implementation changes. Stable releases require a current compatibility ledger, known limitations, repeatable test artifacts, and the release criteria in [ROADMAP.md](ROADMAP.md).

Public human results use `dsh-a11y-human-evidence/0.1.0-draft` under [HUMAN-EVIDENCE.md](HUMAN-EVIDENCE.md). The separately reviewed [evidence catalog](EVIDENCE-CATALOG.json) is authoritative for protocol/task identity, representative-core status, safety criticality, and claim eligibility; a result author cannot self-classify those properties. Failed and partial results remain publishable with `claim: none`; a support claim additionally requires exact revisions, consent, a public review, current validity, effective and safe task completion, no hidden operational assistance, and the level-specific human evidence. A JSON file or validator pass never creates evidence that a person did not actually produce.

## Access and review

The GitHub team `omdsh-dev/accessibility-working-group` receives only repository-scoped access. npm publishing and organization administration remain with existing release and organization controllers. Access is reviewed at the working-group review date and removed when no longer needed.

Raw participant research, if retention is necessary, belongs in a purpose-specific private repository governed by [RESEARCH.md](RESEARCH.md). Public repositories contain only consented, de-identified summaries.
