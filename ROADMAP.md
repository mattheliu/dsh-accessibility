# Accessibility roadmap

[简体中文](ROADMAP.zh.md) | English

Updated: 2026-08-30. This roadmap is evidence-driven and may change after upstream compatibility or assistive-technology findings. An item is complete only when its acceptance evidence is linked; implementation alone is not completion.

## Current baseline

- Runtime companion release candidate: `@oh-my-dsh/dsh-accessibility@0.1.0-beta.6`.
- Tested DSH baseline: `@deepseek-ai/dsh@0.1.1-rc.2` plus `dsh-v0.1.1-rc.2-a11y.4`.
- Upstream development line under review: `0.1.2-alpha.1`.
- Deterministic companion audit: 17 structural checks.
- Accessible View MVP: experimental implementation candidate; automated review in progress, real AT and disabled-developer evidence pending.
- Hermetic AT lab: synthetic, disposable launcher candidate under review; it reduces setup/privacy risk but produces no AT evidence without human observation.
- Listener-verified Windows and Linux screen-reader results remain pending; complete VoiceOver spoken-output records remain pending.

## Phase 0 — foundation and upstream compatibility (through 2026-09-12)

- Rebase or port the core candidate to the current `0.1.2-alpha.1` line, auditing overlapping upstream changes instead of mechanically replaying the old patch.
- Freeze and document the rc.2 maintenance line; narrow package compatibility to versions actually tested.
- Align npm installation guidance and distribution tags so unqualified installs cannot silently receive an older beta.
- Expand the new versioned Chromium/Firefox/WebKit reflow, focus-obscuration, reduced-motion, and forced-color contract from Accessible View to every P0 Web task route; retain real zoom, Windows High Contrast, and low-vision checks as separately owned manual rows.
- Publish the working-group charter, project governance, accessibility statement, research protocol, issue forms, evidence labels, and release gates.

## Phase 1 — companion and developer feedback loop (through 2026-10-10)

- Complete review of the Accessible View MVP built through the additive `conversation.view` slot and DSH conversation projection; require privacy review, assembled-browser evidence, listener-verified VoiceOver/NVDA, and disabled-developer task evidence before treating the item as complete.
- Add contextual accessibility help, focus/name/role/state inspection, and a redacted report exporter.
- Write the `dsh-a11y-testkit` RFC and create its repository only when the first reusable test code is ready.
- Use the versioned hermetic AT lab to make exact VoiceOver/NVDA and disabled-developer task runs reproducible without exposing testers' normal DSH state.
- Complete one listener-verified VoiceOver round and one Windows NVDA round with exact versions, language, spoken output, focus results, and sanitized evidence.

## Phase 2 — assistive-technology matrix and authoring (through 2026-11-21)

- Validate JAWS, Narrator, Orca, keyboard-only, Windows forced colors, browser zoom/reflow, and at least one braille-display workflow.
- Prototype external AT automation by reusing W3C ARIA-AT drivers where possible; keep manual task completion as a release gate.
- Propose a DSH CLI accessibility profile: static numbered prompts, no spinner/cursor redraw, predictable text progress, no-color/high-contrast modes, and machine-readable output.
- Write the permission and deterministic-engine design for an accessibility authoring tool (`a11y_check`) that helps DSH users produce accessible code without implying automated certification.

## Release gates

A stable companion release requires:

- a tested DSH compatibility range and installation path;
- green type, unit, build, package, assembled-browser, and deterministic accessibility gates;
- current VoiceOver and NVDA task evidence, with JAWS/Orca limitations stated if not yet covered;
- a published accessibility statement and known-limitations matrix;
- no default-product defect represented as fixed only by an overlay or diagnostic;
- privacy review for every feature that reads conversation or workspace content.

Do not use “fully accessible” or “certified” as a release claim. Use versioned evidence levels defined in [GOVERNANCE.md](GOVERNANCE.md).

## Program measures

- P0 task pass rate by exact AT/browser combination.
- Age and completeness of every support-matrix row.
- Accessibility regressions escaping a release and time to remediate P0 defects.
- Percentage of new or changed UI covered by keyboard and semantic tests.
- Disabled-user research rounds and task outcomes, not participant identities.
- Compatibility lag between an upstream DSH release candidate and a reviewed accessibility candidate.

Issue count, axe score, download count, or a single tester's result are not success measures by themselves.
