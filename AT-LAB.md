# Hermetic assistive-technology lab

[简体中文](AT-LAB.zh.md) | English

Status: exploratory protocol for public review

Protocol: `dsh-at-lab/1.0.0-draft`

Tracking: [VoiceOver #2](https://github.com/omdsh-dev/dsh-accessibility/issues/2), [NVDA #1](https://github.com/omdsh-dev/dsh-accessibility/issues/1), and [Accessible View #10](https://github.com/omdsh-dev/dsh-accessibility/issues/10)

This protocol tests the `0.1.1-rc.2` companion and Accessible View. Use the separate [DSH core AT lab](AT-CORE-LAB.md) for the current `0.1.2-alpha.2` core candidate.

## Purpose and evidence boundary

The launcher creates a temporary, keyless DSH Web world with the exact external companion and DSH's committed synthetic seeded-history fixture. It makes real VoiceOver, NVDA, Narrator, JAWS, Orca, braille-display, magnifier, switch, voice-input, and keyboard-only observation easier without exposing a tester's normal DSH profile.

Starting the lab, inspecting the accessibility tree, or showing a VoiceOver caption panel is not a screen-reader pass. A valid AT result still needs a person to observe actual speech or braille, focus/cursor behavior, task completion, errors, and workarounds. A disabled-user result additionally needs informed consent and a de-identified task record.

## Exact candidate setup

Build the tagged DSH baseline and the candidate branch first:

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
git clone https://github.com/omdsh-dev/dsh-accessibility.git

cd deepseek-harness
git checkout dsh-v0.1.1-rc.2-a11y.4
pnpm install
pnpm run build:official

cd ../dsh-accessibility
git checkout feat/hermetic-at-lab
pnpm install --frozen-lockfile
pnpm run build
```

From the companion checkout, start one of these modes:

```sh
# Print the local URL without opening a browser (all platforms).
pnpm run lab:at ../deepseek-harness . none

# Open the system default browser (all platforms).
pnpm run lab:at ../deepseek-harness . system

# Open the real installed Safari or Google Chrome on macOS.
pnpm run lab:at ../deepseek-harness . safari
pnpm run lab:at ../deepseek-harness . chrome
```

The launcher prints a versioned JSON readiness record with exact Git revisions, OS information, the local origin, and explicit limitations. It prints the temporary local sign-in URL separately: use it locally, but do not paste it into a public result while the lab is active. It creates no screenshot, recording, upload, or public artifact. Return to the terminal and press Ctrl+C to request cleanup and remove the disposable DSH home, session persistence, workspace, and temporary plugin link. Close the now-inactive browser tab manually.

For an automated startup-and-cleanup smoke check only, pass a timeout in milliseconds:

```sh
pnpm run lab:at ../deepseek-harness . none 1000
```

That smoke result proves only that the lab booted and cleaned up; it is not AT evidence.

## Human observation procedure

Record the macOS/Windows/Linux build, browser version, AT name/version, language, speech voice, verbosity, punctuation, companion revision, and exact DSH revision before the task.

Use only the synthetic session. The backticked names below are stable catalog task IDs; retain them verbatim in evidence records. Then:

1. `discover-structure` — Find DSH's application title and major landmarks without a pointer.
2. `open-synthetic-session` — Locate and open the synthetic conversation from the session tree.
3. `activate-accessible-view` — Move to the Accessible view tab and activate it.
4. `verify-unloaded-privacy` — Confirm that conversation content is absent until Load reading view is activated and the privacy notice is understandable.
5. `load-reading-view` — Load the view; record the announced title, focus target, record count/status, and whether source order is understandable.
6. `read-semantic-content` — Navigate headings, records, code, links, and tool disclosures in browse/reading mode and with ordinary keyboard focus where appropriate.
7. `operate-tool-disclosure` — Expand and collapse tool output; confirm name, expanded state, content boundary, and focus stability.
8. `copy-visible-message` — Copy a visible message; record the announcement and verify that hidden context, reasoning, tool material, paths, and source metadata are not copied.
9. `clear-reading-view` — Clear the view; verify that sensitive content unmounts and focus returns to Load reading view.
10. `return-to-chat` — Return to Chat and complete the ordinary keyboard route without pointer recovery.

For VoiceOver, use the rotor, VO+Left/Right, VO+Space, and Tab/Shift+Tab according to the control. For NVDA, test both browse and focus modes and record mode switches. Do not normalize a surprising utterance: record it exactly enough to reproduce while omitting synthetic content that is not needed for the defect.

## Copyable result template

```md
### AT lab result

- Date/time and tester time zone:
- Consent to publish this de-identified result: yes / no
- Disabled-user evidence: no / yes (state only the relevant access need the tester chose to disclose)
- OS and build:
- Browser and exact version:
- AT and exact version:
- UI/speech language, voice, verbosity, punctuation:
- DSH revision:
- Companion revision:
- Input/output devices:

| Task | Actual speech/braille and focus/cursor result | Completed independently? | Workaround | Pass/fail | Severity |
| --- | --- | --- | --- | --- | --- |
| `discover-structure` | | | | | |
| `open-synthetic-session` | | | | | |
| `activate-accessible-view` | | | | | |
| `verify-unloaded-privacy` | | | | | |
| `load-reading-view` | | | | | |
| `read-semantic-content` | | | | | |
| `operate-tool-disclosure` | | | | | |
| `copy-visible-message` | | | | | |
| `clear-reading-view` | | | | | |
| `return-to-chat` | | | | | |

- Unexpected announcements, repetitions, silence, or cursor traps:
- Recovery path:
- Sanitized evidence link, if consented:
- Reviewer and review date:
```

Submit VoiceOver results to issue #2 and NVDA results to issue #1. Accessible View-specific findings should also reference issue #10. Partial and failed results are useful and must remain labeled as such.

## Privacy and safety

- Do not use a normal DSH home, real workspace, API key, prompt, conversation, username, or private path.
- Do not publish the local sign-in URL while the lab is active.
- Do not publish raw speech history, screen/audio recordings, logs, screenshots, or braille output without reviewing every frame/line and obtaining consent from identifiable participants.
- Stop if the browser opens a non-local URL, an unexpected account/profile surface appears, or synthetic content cannot be distinguished from personal data.
- A launcher crash should still remove its owned state. If the process is forcibly killed, inspect only the printed lab prefix under the OS temporary directory and move that exact directory to Trash; never remove a broad temporary or home directory.
