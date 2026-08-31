# Human accessibility evidence protocol

[简体中文](HUMAN-EVIDENCE.zh.md) | English

Protocol: `dsh-a11y-human-evidence/0.1.0-draft`. Machine-readable contract: [HUMAN-EVIDENCE.schema.json](HUMAN-EVIDENCE.schema.json). Authoritative task classification: [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json), validated by [EVIDENCE-CATALOG.schema.json](EVIDENCE-CATALOG.schema.json).

This protocol turns consented assistive-technology and disabled-developer task results into a public, versioned, privacy-minimized ledger. It does not collect raw research data and it does not turn an automated test, accessibility-tree dump, caption panel, Host event, screenshot, or launch log into human evidence.

## Record, result, and claim are different

Every valid human run may be recorded, including failures and partial results. `claim` remains `none` unless the record satisfies a stricter support-claim gate.

| Record field | Meaning |
| --- | --- |
| `evidenceKind: assistive-technology-run` | A human observed and operated the named browser/terminal and access-technology combination. |
| `evidenceKind: disabled-user-task-run` | A disabled developer performed the task; the public record does not require disability or diagnosis details. |
| `claim: none` | Valuable result, but not eligible to support a public support label. Required for templates, failures, partial results, expired rows, and unresolved high-impact barriers. |
| `claim: a11y-at-tested` | Every claimed task passed effectively and safely with only setup or no assistance; all human observations passed; focus was not lost; consent, exact versions, current review, and a public review issue are present. |
| `claim: a11y-user-validated` | A consented disabled-developer run in which at least one task classified as representative core by the pinned evidence catalog was completed independently, effectively, and safely without operational assistance. A dedicated AT is recorded when used but is not required for every disability or task. |

The evidence level describes what was actually observed; it is not a badge granted because a JSON file exists. The validator fails closed when the record contradicts its claim.

## Required scope

One record covers one exact scenario protocol, task set, DSH revision, any participating component revisions, OS, browser or terminal, access technologies when used, locale, settings, and test date. `latest`, branch names, dirty-state descriptions, placeholder revisions, or an unbounded compatibility range are invalid.

The record includes:

- exact product and component versions plus full commit revisions;
- the pinned evidence-catalog protocol and ID, plus exact cataloged scenario protocol and task IDs;
- OS, browser or terminal, any access technologies and modalities used, input methods, and relevant settings;
- tester category without identity, diagnosis, or disability details;
- affirmative authority to publish a de-identified summary and a private withdrawal route for disabled-user research;
- per-task outcome, independence, effectiveness, safety, assistance, short observed speech/braille/interaction results, focus transitions, barriers, and limitations;
- an overall result and narrowly worded claim scope;
- review status and `validUntil`; and
- the public issue or discussion that reviewed any support claim.

Task IDs in `scenario.taskIds` must exactly equal the task records and must exist under that protocol in the pinned evidence catalog. A record cannot declare its own task to be core or claim-eligible. New or changed tasks require a reviewed catalog update first; known exploratory tasks marked `claimEligible: false` may be recorded only with `claim: none`. Hidden assistance is invalid. A high or blocking barrier, a failed or unobserved claimed checkpoint, unexpected/lost focus, an unsafe or ineffective task, missing public review, or expired evidence prevents a claim.

An `assistive-technology-run` must name at least one actual access technology and can support only `a11y-at-tested`. A `disabled-user-task-run` may leave `accessTechnologies` empty when the participant did not use a dedicated AT; do not invent a placeholder AT. Likewise, `builds.components` is empty for a DSH-only run and lists only components that actually participated.

## Freshness and invalidation

A current record may remain current for at most 120 days. It expires sooner when any relevant DSH minor line, owning UI, scenario, browser, terminal, access technology, language behavior, or dependency changes in a way that may affect the result.

When a row becomes stale:

1. repeat it against the new exact environment; or
2. change `claim` to `none`, set `review.status` to `expired` or `superseded`, state the invalidating change, and retain the historical result if consent still permits publication.

CI intentionally fails when a row still says `current` after `validUntil`. This is a maintenance signal, not evidence that the product regressed.

## Create and validate a record

1. Select the exact protocol and stable task ID from [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json), then use the relevant disposable lab and follow [RESEARCH.md](RESEARCH.md).
2. Submit the matching assistive-technology or disabled-developer result Issue form. Do not put raw data in the issue.
3. Generate a catalog-owned, private-permission scaffold. It refuses unknown protocols/tasks, preserves catalog order, never ingests Issue text, and always emits `recordType: template` with `claim: none`:

```sh
pnpm run evidence:scaffold -- \
  --protocol dsh-core-at-lab/1.0.0-draft \
  --tasks representative-core \
  --kind disabled-user-task-run \
  --locale en-US \
  --output human-evidence.template.json
```

Use `claim-eligible`, `safety-critical`, `all`, or a comma-separated exact task list instead of `representative-core` when appropriate. The output path must be a new `.json` file; existing files are never overwritten. Copying [the authoring example template](evidence/templates/authoring-at.allow-once.template.json) remains supported.
4. Review the de-identified Issue source, replace every synthetic value, choose a new unique `recordId`, set `recordType` to `human-evidence`, and write the reviewed record under `evidence/records/<year>/`. Record the actual result and keep `claim: none` unless every claim condition is proven. Never paste raw Issue exports or private study material into the generator or record.
5. Link the public review issue for a claim and run:

```sh
pnpm run evidence:validate
pnpm run evidence:coverage
```

The checked-in JSON Schemas help editors and external tools. The repository validator additionally enforces the pinned catalog identity, known protocol/task inventory, catalog-owned core and claim eligibility, cross-field task inventory, 120-day freshness, placeholder rejection, and privacy patterns that JSON Schema alone cannot safely express. The [aggregate coverage policy](EVIDENCE-COVERAGE.md) then reports which exact-environment cohorts and representative disabled-developer task sets remain missing; it never upgrades an individual record or replaces release review.

## Privacy and withdrawal

Public evidence must not contain names, handles, email addresses, contact routes, disability or diagnosis fields, usernames, credentials, one-use URLs, runtime Session IDs, private absolute paths, raw transcripts, raw logs, or recording links. Short exact utterances needed to explain interoperability are allowed only after review and consent; prefer concise observations over continuous speech history.

The validator searches every key and string for common credentials and private-data patterns, rejects long log-like values, and rejects copied template markers. Automated privacy lint is only a backstop: a human reviewer must still check context and re-identification risk.

Raw audio/video, consent records, contact details, withdrawal routes, disability information, and unredacted notes stay in the approved private research store with access and deletion controls. If consent is withdrawn, follow [RESEARCH.md](RESEARCH.md), remove attributable public content, and mark or remove the ledger record as required. Never commit a private withdrawal route merely to satisfy the public boolean.

## Current ledger status

The repository currently contains only a non-evidence template. No file is automatically an `a11y-at-tested` or `a11y-user-validated` claim. The aggregate coverage report therefore shows zero human records and twenty-six missing requirements. Support status remains the scoped matrix in [ACCESSIBILITY.md](ACCESSIBILITY.md), and rows remain pending until consented human records pass this protocol and review.
