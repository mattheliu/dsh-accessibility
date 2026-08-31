# DSH accessibility authoring AT lab

[简体中文](AUTHORING-AT-LAB.zh.md) | English

Protocol: `dsh-a11y-authoring-at-lab/0.1.0-draft`.

This disposable lab lets a human use a real assistive technology to operate one complete DSH authoring flow: discover a synthetic preview target, run `a11y_check`, read the source, understand a one-time write request, allow or reject it, inspect the change, and re-run the audit. It uses the real DSH Web surface, approval UI, filesystem tools, local-preview composition, loopback HTTP page, and Chromium audit provider.

The lab does **not** make DSH “fully accessible.” A passing row applies only to the exact DSH revision, composition revision, OS, browser, AT, language, settings, scenario, and task recorded by the tester.

## Evidence boundaries

| Evidence | What it proves | What it never proves by itself |
| --- | --- | --- |
| Bounded startup smoke | The isolated product world boots and cleans up | That the task, approval, repair, UI, or AT works |
| `verify` | Real Chromium can drive the complete allow-once product path; source changes exactly; automated findings change from 2 to 0 | Speech, braille, platform accessibility API behavior, disabled-user independence, or WCAG conformance |
| `verify-reject` | Reject is retained, the edit fails, source remains byte-for-byte unchanged, and the second audit still reports 2 failures | That a human can discover, understand, and operate the decision with AT |
| Human AT row | The recorded AT/browser combination exposes and operates the tested flow with the observed speech/braille and focus behavior | Other combinations, other tasks, or disabled-user independence |
| Disabled-author study | A disabled developer can complete the representative task independently, effectively, and safely under the study protocol | Universal accessibility or certification |

Readiness JSON, Host terminal output, captions, DOM text, screenshots, and automated Chromium are explicitly labelled **not AT evidence**. Only record speech or braille that a human actually observed.

## Prerequisites

- local checkouts of DSH `0.1.2-alpha.2` and `@oh-my-dsh/dsh-a11y-local-preview@0.1.0-alpha.0` with dependencies installed;
- built DSH Web output (`pnpm run build` in the DSH checkout);
- built local-preview output (`pnpm run build` in its checkout);
- the Playwright Chromium binary required by local-preview; and
- a system browser and AT for the human row. Use a normal AT test account, but do not use a normal DSH home or real product content.

The launcher deletes `DEEPSEEK_API_KEY` before starting its child. The scenario is fixed replay and requires no model credential.

## Automated product checks

From this repository, when the checkouts are siblings:

```sh
pnpm run lab:at:authoring -- ../deepseek-harness-alpha2 ../dsh-a11y-local-preview verify 0
pnpm run lab:at:authoring -- ../deepseek-harness-alpha2 ../dsh-a11y-local-preview verify-reject 0
pnpm run lab:at:authoring -- ../deepseek-harness-alpha2 ../dsh-a11y-local-preview none 1000
```

These three commands are development gates, not human evidence. `verify` must report `allowed-once`, `exactRepair: true`, and the exact four-tool sequence. `verify-reject` must report `rejected`, `exactRepair: false`, `sourceUnchanged: true`, and a failed edit. The one-second `none` run proves bounded boot and cleanup without mounting the human-driven replay.

## Launch a human AT row

VoiceOver with Safari on macOS:

```sh
pnpm run lab:at:authoring -- ../deepseek-harness-alpha2 ../dsh-a11y-local-preview safari 0
```

VoiceOver with Chrome on macOS:

```sh
pnpm run lab:at:authoring -- ../deepseek-harness-alpha2 ../dsh-a11y-local-preview chrome 0
```

For NVDA/JAWS/Narrator on Windows or Orca on Linux, use `none 0`, copy the separately printed one-use sign-in URL into the browser under test, and do not publish that URL. `system 0` may be used when the default browser is the intended browser.

The readiness JSON contains versions, revisions, environment, synthetic Session ID, exact task text, persistence policy, and limitations. It intentionally excludes the one-use sign-in URL and preview origin.

## Success scenario: allow once

Catalog task ID: `allow-once`.

Use the screen reader or braille display for the entire task. If sight is used, state that in the record.

1. Open the one-use URL and locate `authoring-at-workspace` and its newest Session.
2. Find the access-mode control and set it to **Read Only**. Confirm that the new state is exposed.
3. Submit `taskInput` exactly as printed by the launcher.
4. Follow progress through the first `a11y_check`, source read, and pending edit. Confirm that the first audit exposes two failures: missing image alternative and empty button name.
5. When DSH presents Approval details, determine the requested operation, target mode, file, and justification without sighted interpretation.
6. Choose **Allow once**. Confirm the decision, edit completion, and source diff are perceivable.
7. Read the second audit. It must expose zero automated failures while retaining the limitation that a clean automated audit is not conformance.
8. Confirm the final neutral message does not itself claim success beyond the tool and audit evidence.
9. Return to the terminal and press Ctrl+C. Confirm the launcher exits and removes its disposable state.

A human row passes only when the tester can complete the task, understand the one-time authority, retain control of the decision, and identify the bounded result without unrecorded sighted assistance. Speech alone is not enough if focus becomes lost or the approval consequence is unclear.

## Safety scenario: reject

Catalog task ID: `reject`.

Relaunch a fresh lab; do not reuse the repaired world.

1. Repeat the setup and submit the same task.
2. In Approval details, choose **Reject**.
3. Confirm the rejection and failed edit are perceivable and focus returns to a useful place.
4. Confirm the second audit still reports both original failures. The Host boundary may report `exactRepair: false`, but that terminal line is not AT evidence.
5. Record whether the final neutral message could be misunderstood. It deliberately says only that the bounded flow finished.

The safety row fails if source changes after rejection, the rejection is hidden, the second audit incorrectly reports zero, or the user cannot distinguish “flow ended” from “repair succeeded.”

## Required human evidence record

Submit one public issue per exact product/browser-or-terminal/AT/language combination using the **Assistive-technology test result** form. Sanitize it before submission. If the result is reviewed for a support claim, encode the public summary with `dsh-a11y-human-evidence/0.1.0-draft` under [HUMAN-EVIDENCE.md](HUMAN-EVIDENCE.md); a failed or partial result remains `claim: none`. At minimum record:

- protocol and stable catalog task ID (`allow-once` or `reject`);
- exact DSH and composition versions and revisions from readiness JSON;
- OS/build and hardware or VM;
- browser/version and AT/version;
- UI and speech language, verbosity, punctuation, browse/focus mode, braille or input-device settings;
- whether the screen was visually inspected and every form of assistance;
- task completion, elapsed time if useful, and outcome;
- focus destination at each transition;
- concise actual speech or braille observations for target discovery, audit summary, finding detail, approval request, decision result, diff, second audit, and final response;
- blockers, confusing announcements, repeated/silent output, inaccessible controls, workarounds, and safety/privacy concerns;
- what was not tested and why the result cannot be generalized; and
- consent for a de-identified public result.

Do not attach raw participant recordings, credentials, private prompts, normal DSH conversations, usernames, private paths, the one-use URL, or unreviewed session logs. Exact short AT utterances necessary to describe interoperability are preferred over a full transcript.

## Privacy, security, and cleanup

The page contains synthetic content and binds to a literal ephemeral `127.0.0.1` origin. The provider blocks DNS names, remote origins, query/fragment secret carriers, ambient credentials, unsafe methods, WebSockets, downloads, service workers, and cross-origin navigation. DSH state, workspace, profile links, session persistence, preview server, and product sign-in token are temporary and removed on exit, including SIGINT/SIGTERM cleanup.

The tester still controls the machine and browser. Do not share the one-use URL, expose the loopback port through tunnelling, install unrelated plugins into the disposable profile, or substitute real source code. If cleanup fails, preserve the terminal error as a private diagnostic and remove the specifically named temporary directory only after verifying its path.

## Known limitations and next evidence

- The fixture is one static English page with two deterministic barriers; it does not cover dynamic applications, authentication, remote content, multi-file repair, undo, merge conflicts, or alternative-text quality judgment.
- The replay is fixed. It proves the product interaction, not live-model reasoning or reliability.
- The provider audit uses Chromium and automated rules; it does not inspect VoiceOver/NVDA platform mappings.
- Manual AT rows still need listener review where exact speech is a release gate.
- Passing VoiceOver and NVDA rows remains insufficient for the project goal until disabled developers complete representative authoring tasks independently, effectively, and safely.

Use [RESEARCH.md](RESEARCH.md) for consent, de-identification, severity, assistance, and disabled-user study rules. Use [RFC-A11Y-AUTHORING.md](RFC-A11Y-AUTHORING.md) for the authority and provider architecture.
