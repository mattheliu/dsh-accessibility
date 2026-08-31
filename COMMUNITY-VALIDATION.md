# Community accessibility validation

[简体中文](COMMUNITY-VALIDATION.zh.md) | English

Status: public participation guide. This guide does not itself create human evidence or a support claim.

DSH needs two different kinds of human result: interoperability observations from people using real assistive technology, and task outcomes from disabled developers. The same person may contribute both, but the records answer different questions and must not be silently combined.

## Choose one route

| What you can contribute | Public intake | What it can become after review |
| --- | --- | --- |
| A reproducible product barrier | [Accessibility barrier form](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=accessibility-barrier.yml) | A defect and regression test; not human support evidence by itself |
| Actual speech, braille, focus, switch, voice-input, magnification, or other AT behavior | [Assistive-technology result form](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=assistive-technology-test.yml) | A scoped `a11y-at-tested` record only after encoding, validation, and public review |
| A disabled developer's independent, effective, and safe task outcome, with or without dedicated AT | [Disabled-developer task result form](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=disabled-developer-task-result.yml) | A scoped `a11y-user-validated` record only after consent, encoding, validation, and public review |

Partial and failed results are useful. Keep their outcome; do not turn them into a generic pass. A launch log, DOM test, accessibility-tree dump, screenshot, caption panel, automated browser, or AI-operated VoiceOver session is not a human AT or disabled-user result.

## Select the versioned task protocol

Use one exact candidate and one protocol per run:

- [Core Web AT lab](AT-CORE-LAB.md) for navigation, sessions, layout, conversation, trajectory, settings, and composer tasks.
- [Live-announcement AT lab](AT-LIVE-LAB.md) for completed, stopped, failed, question, plan, and approval transitions.
- [Companion AT lab](AT-LAB.md) for Accessible View plus the synthetic diagnostic-guidance, focus-inspection, and redacted-report tasks.
- [CLI accessibility protocol](CLI-ACCESSIBILITY.md) for completed and authentication-failure terminal tasks.
- [Accessible authoring AT lab](AUTHORING-AT-LAB.md) for allow-once and rejection safety tasks.

The stable task inventory and representative-core classification come only from [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json). Do not rename task IDs or declare a new task core inside a result.

## Safe setup

1. Use the exact build and full revisions printed by the launcher. Human-evidence launchers fail closed when any participating checkout has tracked, staged, or untracked changes; do not bypass that gate, test `latest`, or use an unrecorded working tree.
2. Use only the disposable DSH home, synthetic content, loopback origin, and temporary workspace supplied by the matching lab.
3. Prefer the lab's `chrome` mode on macOS, Windows, or Linux when Chrome/Chromium is installed. It creates and removes an isolated profile, disables background networking, and blocks non-loopback name resolution; on Windows this is the preferred NVDA/JAWS/Narrator route. Safari or `system` requires a dedicated clean browser profile. Stop before testing if personal tabs, history, bookmarks, accounts, extensions, autofill, prompts, conversations, credentials, or paths appear.
4. Never publish the one-use sign-in URL. Do not tunnel the loopback server or substitute a real workspace.
5. Record OS/build, browser or terminal/shell versions, every AT and version actually used, locale, input/output methods, relevant settings, exact DSH/component revisions, and all assistance.
6. Return to the launcher and request cleanup. If interrupted state remains, inspect only the exact printed lab directory and move it to Trash; never remove a broad temporary or home path.

## Observe the task, not the expected answer

For every stable task ID, record:

- pass, partial, or fail and whether the task was completed;
- whether completion was independent, effective, and safe;
- actual speech or braille only when a person observed it, plus focus/cursor before and after important transitions;
- for a support claim, list an AT modality only when that modality was directly observed on every claimed task; record an unobserved modality as a limitation instead of an implied pass;
- control role, name, state, approval consequence, error, and recovery as understood by the tester;
- exact ledger assistance level (`none`, `setup-only`, `verbal`, `sighted-operation`, or `other`), workaround, and smallest reproducible barrier;
- what was not tested and every reason the result cannot be generalized.

Do not “correct” surprising speech into expected wording. Do not infer spoken output from captions, DOM, platform accessibility APIs, terminal events, or an AI agent's interaction.

## Disabled-developer participation

A disabled-developer result records only the category the participant chose for this task. Do not request or publish identity, diagnosis, disability details, employer, contact information, or medical history. Dedicated AT is optional and must not be invented when none was used.

Participation is voluntary and may stop at any time. Study owners must provide accessible instructions, a private withdrawal route, and fair compensation for time and disability-related participation costs. One participant never represents a disability group. To satisfy one aggregate disabled-developer requirement, one participant must complete all representative-core tasks for that protocol in one record; the project never combines anonymous records as if they came from one person.

For a private withdrawal or participant-data request, use the repository's [private security and privacy channel](https://github.com/omdsh-dev/dsh-accessibility/security/advisories/new). Do not put contact details or raw consent material in a public Issue.

## Review lifecycle

1. A tester or authorized study owner submits the minimum de-identified public result.
2. A maintainer preserves failures and uses `pnpm run evidence:scaffold` to create a catalog-owned `dsh-a11y-human-evidence/0.1.0-draft` template with `claim: none`. The command accepts protocol/task selectors, not Issue or participant text.
3. Review checks consent, privacy, exact versions, stable task IDs, observations, focus, assistance, effectiveness, safety, barriers, and limitations.
4. The repository validator checks the record; it never manufactures evidence or upgrades a result automatically.
5. A narrowly scoped claim may be proposed only when every claim gate passes and a public review Issue is linked.
6. `pnpm run evidence:coverage` reports exact-environment gaps without mixing incompatible cohorts. Relevant product or environment changes expire the record and require a new run.

The current ledger contains zero human records, so all 26 draft aggregate requirements remain missing. This is an invitation to contribute evidence, not a claim that the candidate is inaccessible or accessible.

See [RESEARCH.md](RESEARCH.md), [HUMAN-EVIDENCE.md](HUMAN-EVIDENCE.md), and [EVIDENCE-COVERAGE.md](EVIDENCE-COVERAGE.md) for the normative privacy, record, and aggregation rules.
