# DSH accessibility core compatibility ledger

[简体中文](CORE-COMPATIBILITY.zh.md) | English

Reviewed: 2026-08-30. This ledger records source compatibility and evidence status; it is not a conformance claim.

## Version records

| Record | Exact version or revision | Status |
| --- | --- | --- |
| Official npm baseline | `@deepseek-ai/dsh@0.1.1-rc.2` | npm `latest` and `next` on 2026-08-30 |
| rc.2 official source | `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` | immutable maintenance base |
| rc.2 full-patch accessibility candidate | `dsh-v0.1.1-rc.2-a11y.4`, commit `3064d99cdc9653327e774b7306b839395b24a272` | maintained reference; real-AT evidence remains incomplete |
| Official alpha.1 source | `dsh-v0.1.2-alpha.1`, commit `cd5ef8148158c3a752a658978873241fdf8e2bbc` | current upstream source HEAD on 2026-08-30; not published to npm |
| Fork portability base | `073359c4d5a5b284d60dbc052f5aa370b4639892` | official alpha.1 plus 16 fork CI, test, and terminal fixes |
| Partial alpha.1 accessibility candidate | PR [omdsh-dev/deepseek-harness#1](https://github.com/omdsh-dev/deepseek-harness/pull/1), commit `76aa5dfd7ca98288f425857f1c9ce5da979692af` | automated review passed; incomplete core-port scope |
| Published companion | `@oh-my-dsh/dsh-accessibility@0.1.0-beta.6` | exact rc.2 peers only; npm `beta` on 2026-08-30 |

The npm `latest` tag for the companion still points to `0.1.0-beta.3`. Install `0.1.0-beta.6` explicitly. Do not force the rc.2 companion onto alpha.1: its peer range and structured client interfaces have not been reviewed for that line.

## rc.2-to-alpha.1 disposition

The rc.2 candidate changed 191 paths across the pre-alpha client. Alpha.1 reorganized the Web client and test projections, so path equality is not a compatibility result. The partial alpha.1 candidate changes 21 client source paths and retains 80 test or snapshot paths relative to its fork base. Each behavior still needs an explicit disposition.

Status terms:

- **Rebuilt and automated:** the alpha.1 owner and deterministic evidence are linked.
- **Evidence only:** the gate observes a property but does not establish real assistive-technology or disabled-user operation.
- **Pending re-audit:** the rc.2 patch was not replayed; current alpha.1 behavior may be present, changed, or missing and must not be represented as verified.

| rc.2 behavior group | Alpha.1 disposition | Current evidence and remaining gate |
| --- | --- | --- |
| Shared modal initial focus, containment, nested dismissal, application inertness, and connected-opener restoration | **Rebuilt and automated** in `Modal` | Focused component tests and assembled keyboard path pass. VoiceOver/NVDA speech, virtual-cursor containment, and real consumer workflows remain pending. |
| Shared menu-button relationship, arrow/Home/End/typeahead/submenu navigation, Tab exit, and focus return | **Rebuilt and automated** in `Menu`; Tooltip trigger ref forwarding added for alpha.1 composition | Component and accessibility-tree snapshots pass. Real AT menu announcements and browser-specific interaction modes remain pending. |
| Application `main`, one localized H1, named Session navigation/details landmarks, closed-Details exclusion, and keyboard-adjustable separators | **Rebuilt and automated** in the alpha.1 shell | Component, assembled-tree, reflow, and keyboard checks pass. Zoom, magnifier, switch, speech-input, and real AT task evidence remain pending. |
| Context Meter disclosure controlling a named information region | **Rebuilt and automated** | Component and assembled-tree evidence pass. Spoken state/relationship output remains pending. |
| Settings modal reflow, focus visibility, focus unobscuration, and focused-control scrolling at 640/320 CSS pixels | **Rebuilt and automated** | Chromium, Firefox, and WebKit gate passes. CSS-pixel equivalence is not real 200%/400% zoom evidence. |
| Reduced-motion and forced-color participation | **Evidence only** in the alpha.1 cross-browser gate | Reduced-motion runs in three engines and Chromium forced-color emulation passes. Windows High Contrast, authored system-color usability, and motion-disability review remain pending. |
| Session/workspace/search trees, roving focus, disclosure keys, collapsed-search exclusion, and focus restoration | **Pending re-audit** | rc.2 code was not ported as a unit. Audit current alpha.1 navigation and search owners, then add focused and assembled task evidence. |
| Model selector, command combobox/listbox, and popup highlight behavior | **Pending re-audit** | No alpha.1 disposition or release-level AT evidence is recorded. |
| Chat/Trajectory tab lists, Trajectory listbox/range selection, ledger keyboard navigation, and details separator | **Pending re-audit** | No alpha.1 disposition or release-level AT evidence is recorded. |
| User-question radio groups/custom fields and feedback-note focus ownership | **Pending re-audit** | Shared primitive coverage does not prove these consumers. Complete keyboard, error, cancellation, and recovery tasks are required. |
| Conversation log naming, user/Assistant articles, composer naming, and one bounded completion announcement | **Pending re-audit** | No alpha.1 disposition is recorded. Token-by-token live speech must remain avoided while completion is discoverable. |
| Tool disclosure ownership, stable spoken names, separate file links, plugin list semantics, JSON trees, and subagent lineage trees | **Pending re-audit** | No alpha.1 disposition is recorded. Tool approval, failure, destructive-action comprehension, and recovery require task evidence. |
| Image lightbox, onboarding, workspace/directory dialogs, and other modal consumers | **Pending re-audit** | The shared modal is covered, but every consumer must prove naming, initial focus, dismissal policy, and restoration. |
| Theme text contrast and non-color state cues | **Pending re-audit** | The rc.2 token changes were not ported as a reviewed set. Automated contrast plus low-vision review in both themes is required. |
| Linux/macOS/Windows release workflow and assembled application scan | **Replaced with versioned deterministic evidence** | Candidate CI is green across the repository matrix and the focused Chromium/Firefox/WebKit gate. This remains `a11y-automated-reviewed`, not `a11y-at-tested`. |

## Candidate evidence

The exact merge candidate tested by GitHub Actions is represented by PR #1 at `76aa5dfd7ca98288f425857f1c9ce5da979692af`. The CI run passed the required accessibility browser matrix, Node 22/24/26 lanes, Windows build/coverage/native/observational lanes, Python release-shaped matrix, package assembly, and aggregate status. The accessibility browser job is [Actions run 33264686646, job 99132574894](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33264686646/job/99132574894).

These results establish deterministic source, build, keyboard, DOM, browser accessibility-tree, reflow-equivalent, focus-geometry, reduced-motion, and forced-color-emulation evidence for the implemented rows only. They do not establish exact screen-reader speech, braille output, operating-system accessibility API behavior on physical target systems, independent task completion, effectiveness, safety, or disabled-user acceptance.

## Compatibility decision

The partial alpha.1 candidate is reviewable but does **not** replace `dsh-v0.1.1-rc.2-a11y.4`, expand the companion's peer range, authorize an alpha.1 npm release, or justify a complete-accessibility claim. Replacement requires dispositions and passing evidence for every pending row, current VoiceOver and NVDA task records, and disabled-developer task evidence under [RESEARCH.md](RESEARCH.md).

Rollback is version selection, not DOM repair: use the immutable rc.2 maintenance reference with the exact beta.6 companion, or return to the official unmodified DSH version while recording the missing behavior. Never represent a host defect as fixed only by the companion.

## Next review triggers

Review this ledger when any of these changes:

- the upstream DSH source HEAD or published npm line;
- a changed client owner in a pending or verified row;
- the companion peer range or structured projection;
- a browser, operating-system, or assistive-technology major version used as evidence; or
- a real-AT or disabled-user result that changes a support decision.
