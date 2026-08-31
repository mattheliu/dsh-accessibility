# Changelog

## Unreleased

- Add an experimental, user-loaded Accessible View through DSH's official `conversation.view` slot and structured session projection.
- Preserve source-order conversation records and semantic Markdown/code, including an in-progress assistant record, without scraping or rewriting host DOM.
- Require separate disclosures for context, reasoning, tool arguments/output, command input, and raw errors; provide explicit per-message copy, pagination feedback, and focus restoration on clear.
- Add bilingual privacy/threat review, versioned real-AT protocol, known limitations, registration/privacy/interaction tests, and idle/loaded axe-core gates.
- Keep stable support and npm publication gated on assembled-browser, listener-verified VoiceOver/NVDA, privacy review, and disabled-developer task evidence.
- Seed `dsh-non-at-browser/1.0.0-draft` with reusable browser assertions and exact-revision JSON evidence across Chromium, Firefox, and WebKit for 640/320 CSS px reflow, focus visibility/obscuration, reduced motion, and Chromium forced colors.
- Prevent Accessible View controls from receiving keyboard focus underneath the sticky DSH composer at narrow reflow widths.
- Add a versioned hermetic AT lab launcher with a disposable DSH home, synthetic seeded session, exact-revision readiness record, visible system/Safari/Chrome launch modes, bounded smoke mode, and signal-safe cleanup.
- Add a separate `0.1.2-alpha.2` DSH core AT lab, keep core and companion evidence version-scoped, and open system browsers through the disposable one-use sign-in URL without publishing it in readiness JSON.
- Add a six-scenario live-announcement AT lab for completed, stopped, failed, question, plan-review, and approval transitions, with finite replay inputs and explicit Host-versus-human evidence boundaries.

## 0.1.0-beta.6 - 2026-08-29

- Establish the DSH Accessibility Working Group project hub with bilingual governance, roadmap, accessibility statement, disabled-user research protocol, and contribution guidance.
- Define versioned evidence levels and stable-release gates for automated review, real assistive-technology testing, and disabled-user validation.
- Add structured bilingual issue forms, a pull-request evidence checklist, code ownership, labels, milestones, and an initial public work backlog.
- Scope DSH client peer dependencies to the verified `0.1.1-rc.2` line instead of advertising untested compatibility through `<0.2.0`.

## 0.1.0-beta.5 - 2026-08-26

- Expand the deterministic page audit from fourteen to seventeen checks with an application-heading contract, native/ARIA list ownership, and nested-interactive detection.
- Record a VoiceOver 10-enabled Safari 18.5 native-tree and focus-route run while keeping listener-verified speech explicitly pending.
- Point installation guidance at the fourth immutable accessibility core candidate.

## 0.1.0-beta.4 - 2026-08-26

- Link the organization-pinned DSH accessibility core build and document the complete installation path.
- Add the bilingual assistive-technology support matrix and manual regression protocol.
- Add axe-core regression coverage for the rendered settings surface.
- Add cross-platform CI and trusted-publishing workflows.
- Add contribution and security policies.
- Register the browser bundle under its full scoped npm id so DSH can load the installed package.
- Add one required aggregate CI status across the complete operating-system and Node matrix.
- Record Safari 18.5 native accessibility-tree and keyboard regression evidence without treating it as a complete spoken-output certification.

## 0.1.0-beta.3 - 2026-08-26

- Publish the plugin as `@oh-my-dsh/dsh-accessibility` from `omdsh-dev/dsh-accessibility`.
- Add the npm installation path.

## 0.1.0-beta.2 - 2026-08-26

- Expand the deterministic page audit from seven to fourteen structural checks.
- Add menu, listbox, tree, radio-group, tab, dialog, and separator guidance.
