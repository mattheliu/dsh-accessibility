# Accessibility roadmap

[简体中文](ROADMAP.zh.md) | English

Updated: 2026-08-31. This roadmap is evidence-driven and may change after upstream compatibility or assistive-technology findings. An item is complete only when its acceptance evidence is linked; implementation alone is not completion.

## Current baseline

- Runtime companion release candidate: `@oh-my-dsh/dsh-accessibility@0.1.0-beta.6`.
- Tested DSH baseline: `@deepseek-ai/dsh@0.1.1-rc.2` plus `dsh-v0.1.1-rc.2-a11y.4`.
- Upstream development line under review: `0.1.2-alpha.2`.
- Deterministic companion audit: 17 structural checks.
- Accessible View MVP: experimental implementation candidate; automated review in progress, real AT and disabled-developer evidence pending.
- Hermetic AT labs: separate synthetic, disposable launchers cover the `0.1.2-alpha.2` core candidate and the rc.2 companion; they reduce setup/privacy risk but produce no AT evidence without human observation.
- Live-announcement lab: six synthetic alpha.2 replay scenarios separate durable Host boundaries from actual AT speech/braille evidence.
- CLI accessibility candidate: low-noise text and `dsh-headless-result/1.0.0` output are implemented on the alpha.2 branch; draft process conformance is reproducible, while real terminal/screen-reader and disabled-developer evidence remain pending.
- Accessible authoring foundation: the bilingual RFC and standalone local testkit, caller-owned-page provider, and read-only DSH adapter now form a real-Chromium/published-`ToolRuntime` no-navigation chain; production DSH/companion composition, publication, any separately approved navigator, real AT, and disabled-author evidence remain pending.
- Listener-verified Windows and Linux screen-reader results remain pending; complete VoiceOver spoken-output records remain pending.

## Phase 0 — foundation and upstream compatibility (through 2026-09-12)

- Rebase or port the core candidate to the current `0.1.2-alpha.2` line, auditing overlapping upstream changes instead of mechanically replaying the old patch.
- Freeze and document the rc.2 maintenance line; narrow package compatibility to versions actually tested.
- Align npm installation guidance and distribution tags so unqualified installs cannot silently receive an older beta.
- Expand the new versioned Chromium/Firefox/WebKit reflow, focus-obscuration, reduced-motion, and forced-color contract from Accessible View to every P0 Web task route; retain real zoom, Windows High Contrast, and low-vision checks as separately owned manual rows.
- Publish the working-group charter, project governance, accessibility statement, research protocol, issue forms, evidence labels, and release gates.

## Phase 1 — companion and developer feedback loop (through 2026-10-10)

- Complete review of the Accessible View MVP built through the additive `conversation.view` slot and DSH conversation projection; require privacy review, assembled-browser evidence, listener-verified VoiceOver/NVDA, and disabled-developer task evidence before treating the item as complete.
- Add contextual accessibility help, focus/name/role/state inspection, and a redacted report exporter.
- Review the bilingual authoring RFC and the three reusable standalone implementations (`dsh-a11y-testkit`, `dsh-a11y-page-provider`, and `dsh-a11y-authoring`); create remote repositories only after each protocol, privacy boundary, fixture set, and package is ready for public review.
- Use the versioned hermetic AT lab to make exact VoiceOver/NVDA and disabled-developer task runs reproducible without exposing testers' normal DSH state.
- Run every response/tool/request terminal scenario through the live-announcement lab; retain failed, repeated, coalesced, and silent results by exact AT/browser/language row.
- Complete one listener-verified VoiceOver round and one Windows NVDA round with exact versions, language, spoken output, focus results, and sanitized evidence.

## Phase 2 — assistive-technology matrix and authoring (through 2026-11-21)

- Validate JAWS, Narrator, Orca, keyboard-only, Windows forced colors, browser zoom/reflow, and at least one braille-display workflow.
- Prototype external AT automation by reusing W3C ARIA-AT drivers where possible; keep manual task completion as a release gate.
- Validate the DSH CLI accessibility candidate across VoiceOver, NVDA, JAWS, Narrator, and Orca terminals; retain the automated `dsh-cli-accessibility/1.0.0-draft` process result separately from human speech/braille and independent-task evidence.
- Integrate the locally assembled opt-in `a11y_check` chain into a reviewed DSH product composition; retain cancellation, cleanup, privacy, and exact-package evidence while keeping it read-only, preserving repair choice, and never implying automated certification.

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
