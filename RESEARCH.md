# Disabled-user research and evidence protocol

[简体中文](RESEARCH.zh.md) | English

This protocol applies to moderated tests, community AT submissions, recordings, interviews, and any evidence used for `a11y-user-validated` or `a11y-at-tested` claims.

## Participation

- Recruit actual or likely DSH users across relevant disability, assistive-technology, language, and experience profiles. One participant does not represent a disability group.
- Budget fair compensation for time and disability-related participation costs. A public contribution is welcome, but a stable release must not depend on repeated unpaid labor from the same people.
- Provide instructions, consent material, and communication in a format the participant can use. Participation is voluntary and may stop at any time.

## Informed consent

Before collecting data, explain who is conducting the study, its purpose and tasks, what is collected, whether observers or recording are present, how results will be used, who can access the data, the retention period, and how to withdraw. Record affirmative consent in an accessible format. Consent to participate is separate from consent to record or publish a quotation.

## Safe test environment

- Use the exact tagged build and record DSH, plugin, OS, browser, AT, language, verbosity, and punctuation settings.
- Prefer a disposable workspace and synthetic prompts. Do not expose a DSH server publicly or ask a participant to reveal a personal workspace, credential, conversation, or filesystem path.
- Prefer the version-matched [core lab](AT-CORE-LAB.md), [live-announcement lab](AT-LIVE-LAB.md), [companion lab](AT-LAB.md), or [authoring AT lab](AUTHORING-AT-LAB.md) when it matches the research question. Its readiness record and Host terminal lines are setup/product metadata, not participant or AT evidence.
- Record task completion, focus destination, role/name/state, exact spoken output when relevant, workaround, and severity. Do not require secret or private content to reproduce a defect.

## Data minimization and storage

- Public issues contain only de-identified results and the minimum technical context needed to reproduce a problem.
- Public structured summaries use `dsh-a11y-human-evidence/0.1.0-draft` under [HUMAN-EVIDENCE.md](HUMAN-EVIDENCE.md) and only stable task IDs registered in [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json). Record tester category, not identity, diagnosis, or disability details. Consent records, contact details, and withdrawal handling remain private and are never copied into the ledger.
- Raw audio/video, contact details, consent records, disability information, and unredacted notes must never be committed to a public repository or attached to public CI artifacts.
- If raw data must be retained, store it in a purpose-specific private repository or approved encrypted research store with named access, a deletion date, and an access log. The default is to delete raw session material after synthesis; any longer retention needs an explicit reason and consent.
- Diagnostic and report features default to excluding prompts, model output, credentials, usernames, absolute paths, and environment identifiers.

## Publication and withdrawal

Publish scope, method, participant count, relevant user/AT characteristics, versions, limitations, and de-identified findings. Do not generalize beyond the tested sample. A participant may withdraw consent; locate and delete covered raw data and remove attributable public material when feasible and required by the consent terms.

Security, conduct, and participant-safety incidents use private routes. Public status reports may state that a case exists only when re-identification risk is acceptable.
