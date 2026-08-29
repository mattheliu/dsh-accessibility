# Non-AT browser evidence contract

[简体中文](RFC-BROWSER-EVIDENCE.zh.md) | English

Status: draft for public review

Protocol: `dsh-non-at-browser/1.0.0-draft`

Initial target: Accessible View on DSH `0.1.1-rc.2` plus `dsh-v0.1.1-rc.2-a11y.4`

Tracking: [#9](https://github.com/omdsh-dev/dsh-accessibility/issues/9)

## Decision

DSH accessibility releases need deterministic browser evidence beyond DOM names and roles. The development-only assembled runner therefore loads the real external companion through DSH's ModuleLoader and records reflow, focus visibility/obscuration, reduced-motion, and forced-color participation under an explicit versioned protocol.

This first consumer covers Accessible View. It seeds a reusable helper but does **not** complete the whole-DSH gate: the application shell, Chat core task flows, Settings, approvals/questions, menus/dialogs, authoring output, and error recovery still need to consume the same contract before issue #9 can close.

## Standards map

| Requirement | Versioned reference | Automated assertion | Evidence boundary |
| --- | --- | --- | --- |
| Reflow | WCAG 2.2 SC 1.4.10 (AA) | Run at 640 and 320 CSS px; require document `scrollWidth` to stay within `clientWidth` and reject programmatic page-level horizontal movement. | A 320 CSS px viewport is the specified 400% equivalent dimension. Real browser zoom, text scaling, and excepted two-dimensional content still need manual review. |
| Focus visible | WCAG 2.2 SC 2.4.7 (AA) | Require the focused control to match `:focus-visible` and expose a non-zero outline or box shadow. | Does not measure focus-indicator pixel area or contrast. |
| Focus not obscured | WCAG 2.2 SC 2.4.11 (AA) | Intersect the control with the viewport and require it to be topmost at one of nine sampled points after focus. | Proves the minimum sampled boundary, not complete pixel visibility or the enhanced AAA criterion. |
| Animation from interactions | WCAG 2.2 SC 2.3.3 (AAA) | Under `prefers-reduced-motion: reduce`, reject visible candidate descendants with motion-capable transitions, named CSS animations, or running keyframes that move/resize/reposition. | Paint-only opacity/color changes are not classified as motion; essential-animation exceptions require public review. |
| Forced colors | CSS Color Adjustment Level 1 | In Chromium forced-colors emulation, require the media query to match, reject visible candidate elements with `forced-color-adjust: none`, and record computed control colors/borders. | Browser emulation is not a real Windows High Contrast observation and is not a non-text-contrast certification. |

Normative and explanatory references:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Understanding 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [Understanding 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [Understanding 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [CSS Color Adjustment Module Level 1](https://www.w3.org/TR/css-color-adjust-1/)

## Runner and data flow

`scripts/run-assembled-browser.mjs` accepts an exact DSH checkout, a companion checkout, and a comma-separated browser list. It verifies package identities and versions, copies the test template and reusable assertion helper into DSH's Web test lane with exclusive creation, runs DSH's own Vitest/browser scaffold, and removes both temporary files even on failure.

The test uses a temporary DSH home and DSH's synthetic seeded-history fixture. It does not use the ambient DSH profile, credentials, workspace, prompts, or sessions. Passing runs create no screenshot or uploaded artifact. The runner accepts only `chromium`, `firefox`, and `webkit`; CI installs and executes all three. Forced-color emulation is currently Chromium-only because the cross-engine contract is not equivalent.

## Evidence record

Every browser emits one JSON object containing:

- protocol and evidence kind;
- exact standard identifiers;
- DSH version and Git revision;
- companion version and Git revision;
- OS, OS release, architecture, browser engine, and engine version;
- 640/320 CSS px overflow measurements;
- per-control focus state, sampled visibility, viewport intersection, outline, and shadow;
- reduced-motion transition/animation findings;
- forced-color media state, opt-out count, and computed control samples when supported;
- fixed limitations that prevent the record from being misread as AT or disabled-user evidence.

A record is valid only when the test process exits zero and the containing CI commit matches the recorded revision. Logs from a dirty checkout are development diagnostics, not release evidence.

## False-positive and exception policy

- Do not add pixel tolerances above the current one-CSS-pixel rounding allowance without a reproducible engine defect.
- Do not exclude a selector, control, animation, or region only to make a failure green. An exception needs the exact standard rationale, owner, expiry/review date, synthetic reproduction, and a protocol minor-version change.
- Two-dimensional content exceptions under SC 1.4.10 must be local scrollers whose layout is essential; they must not give the page itself a second scroll direction.
- An essential motion exception must state what information or functionality is lost without movement and provide a user-controlled non-motion alternative when the standard requires it.
- Engine-specific absence of a capability is `not-run`, never `pass`.

## Manual and user evidence still required

Automated browser results do not prove real browser zoom, Windows High Contrast themes, macOS Increase Contrast, OS text scaling, magnifier use, low-vision task efficiency, switch/voice input, spoken output, braille output, or independent task completion. Release evidence must retain separate named rows for those environments and for consented disabled-user studies.

Before treating a DSH core route as covered, manually verify at minimum:

1. browser zoom at 200% and 400%, text-only zoom where supported, and loss of information/functionality;
2. Windows High Contrast themes and focus-indicator contrast;
3. the focused component and indicator against sticky, modal, toast, and non-modal layers;
4. OS Reduce Motion with the task's actual interactions;
5. keyboard-only task completion without pointer recovery.

## Release gate

The initial Accessible View consumer may carry `evidence:automated` after all three engine jobs pass on an exact commit. Issue #9 stays open until every published P0 Web task route consumes the contract, manual-only rows have current owners/results, and failures block the relevant release. This RFC never authorizes “fully accessible,” certification, AT-tested, or user-validated language.
