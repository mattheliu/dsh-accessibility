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
| Partial alpha.1 accessibility candidate | PR [omdsh-dev/deepseek-harness#1](https://github.com/omdsh-dev/deepseek-harness/pull/1), commit `a734cec0a00efdd18e6bd5286c7641f608c6311c` | automated review passed after one isolated Windows coverage rerun; incomplete core-port scope |
| Published companion | `@oh-my-dsh/dsh-accessibility@0.1.0-beta.6` | exact rc.2 peers only; npm `beta` on 2026-08-30 |

The npm `latest` tag for the companion still points to `0.1.0-beta.3`. Install `0.1.0-beta.6` explicitly. Do not force the rc.2 companion onto alpha.1: its peer range and structured client interfaces have not been reviewed for that line.

## rc.2-to-alpha.1 disposition

The rc.2 candidate changed 191 paths across the pre-alpha client. Alpha.1 reorganized the Web client and test projections, so path equality is not a compatibility result. The partial alpha.1 candidate changes 39 client source paths and retains 109 test or snapshot paths across 187 changed paths relative to its fork base. Each behavior still needs an explicit disposition.

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
| Session/workspace/search trees, roving focus, disclosure keys, collapsed-search exclusion, and focus restoration | **Rebuilt and automated** in the Workspace and Session tree owners | Grouped, flat, and search-result trees expose one roving row entry, authored levels, disclosure keys, and search focus return in focused and assembled browser checks. Real AT hierarchy/virtual-cursor output and disabled-developer task evidence remain pending. |
| Model selector, command combobox/listbox, and popup highlight behavior | **Rebuilt and automated** in the model seat and command popup owners | The model menu has one trigger entry, edge opening, pane navigation, and trigger restoration. The command search owns its listbox through active descendant and returns focus to the exact composer through an executed binder injection. Real spoken/braille output and disabled-developer task evidence remain pending. |
| Chat/Trajectory tab lists, Trajectory listbox/range selection, ledger keyboard navigation, and details separator | **Rebuilt and automated** in the Chat and Trajectory owners | Named and owned tab lists expose one roving tab stop with Arrow/Home/End navigation and stable panels. The Trajectory active-descendant listbox supports range/all selection and Escape; the virtual ledger supports Arrow/Home/End/Enter/Space; the details separator is keyboard adjustable. Real AT speech, braille, virtual-cursor operation, and disabled-developer task evidence remain pending. |
| User-question radio groups/custom fields and feedback-note focus ownership | **Rebuilt and automated** in the user-question composer | Named radio groups use roving Arrow/Home/End navigation, the custom answer has an accessible field, and focus transitions remain stable across the modern composition path and legacy key code 229. Cancellation, error, and recovery paths are automated. Real AT speech/braille, error-announcement behavior, and disabled-user task evidence remain pending. |
| Conversation log naming, user/Assistant articles, composer naming, and one bounded completion announcement | **Rebuilt and automated** in `ChatView`, `ChatNodeSeat`, and `MessageItem` | The transcript is a named non-live log that exposes running state; durable user messages and Assistant steps are named articles. Initial settled history and streaming chunks stay silent, while one atomic polite status is created only after an observed running-to-idle transition. Focused component tests, 91-file assembled snapshots, and the Chromium/Firefox/WebKit conversation scenario pass. Exact screen-reader speech, braille output, long-conversation navigation, interruption behavior, and disabled-developer task evidence remain pending. |
| Tool disclosure ownership, stable spoken names, separate file links, plugin list semantics, JSON trees, and subagent lineage trees | **Pending re-audit** | No alpha.1 disposition is recorded. Tool approval, failure, destructive-action comprehension, and recovery require task evidence. |
| Image lightbox, onboarding, workspace/directory dialogs, and other modal consumers | **Pending re-audit** | The shared modal is covered, but every consumer must prove naming, initial focus, dismissal policy, and restoration. |
| Theme text contrast and non-color state cues | **Pending re-audit** | The rc.2 token changes were not ported as a reviewed set. Automated contrast plus low-vision review in both themes is required. |
| Linux/macOS/Windows release workflow and assembled application scan | **Replaced with versioned deterministic evidence** | Candidate CI is green across the repository matrix and the focused Chromium/Firefox/WebKit gate. This remains `a11y-automated-reviewed`, not `a11y-at-tested`. |

## Candidate evidence

The exact merge candidate tested by GitHub Actions is represented by PR #1 at `a734cec0a00efdd18e6bd5286c7641f608c6311c`. [Actions run 33285824826, attempt 2](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826) completed successfully across the required accessibility browser matrix, Node 22/24/26 lanes, Linux and Windows exhaustive coverage, Windows build/native/observational and Wine lanes, Python release-shaped matrix, package assembly, snapshots, and aggregate status. The final accessibility browser job is [99191121382](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99191121382), the snapshot/artifact job is [99191106736](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99191106736), Linux coverage is [99191122841](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99191122841), Windows coverage is [99191106211](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99191106211), Windows native tests are [99191117211](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99191117211), and the aggregate job is [99191107436](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99191107436).

The accessibility browser job passed 7 of 7 Chromium scenarios, 6 of 7 Firefox scenarios with the forced-colors case skipped, and 6 of 7 WebKit scenarios with the same capability-bound skip. The snapshot job passed all 91 Web test files, with 307 tests passed and 13 conditionally skipped across 320 tests. Linux coverage passed 989 of 996 files and 16,018 of 16,059 tests. Windows coverage passed 956 of 959 files and 15,346 of 15,371 tests. Both platforms reported 100% statements, branches, functions, and lines.

The current run history is retained rather than rewritten as an uninterrupted pass. The first attempt's only failing job was [Windows coverage 99188759858](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33285824826/job/99188759858): the independent `SessionProjectionCache` threshold test read `null` instead of the expected mark inside its polling window. All other jobs, including the complete snapshot and cross-browser accessibility gates, passed. One failed-job rerun on a fresh runner passed the Windows suite and coverage totals above. The assertion was not waived, and the rerun history remains part of the evidence boundary.

Earlier validation history is also retained. After the `ee2420bcf34a0932db682c3dc3d77fe126fe2358` checkpoint, the expanded candidate's [run 33277553260](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33277553260) failed Windows coverage first on two stale projection-cache assertions plus one credentials-lock `EPERM`, then on one stale turn-end checkpoint after a rerun. That repeat isolated a real product race: older and newer session-projection writes could commit out of call order. Commit `01d4eb8fce45e2643dfccb88ef451e69bbc1a91d` serialized per-session writes; its [run 33279877992](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33279877992) passed Windows native tests and every other job but exposed a remaining five-second filesystem-poll window in the new ordering regression test under coverage load. The `0f65b7f13b343c096f3e901889753c81feaa8155` checkpoint waits for the newer write promise as a deterministic queue barrier and also makes a spill-cleanup equality test compare the timestamp actually retained by the filesystem. No failed assertion was waived, and that earlier checkpoint required no rerun.

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
