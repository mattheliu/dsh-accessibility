# Human evidence coverage policy

[简体中文](EVIDENCE-COVERAGE.zh.md) | English

Policy protocol: `dsh-a11y-evidence-coverage-policy/0.1.0-draft`. Report protocol: `dsh-a11y-evidence-coverage-report/0.1.0-draft`.

Machine-readable contracts: [EVIDENCE-COVERAGE-POLICY.json](EVIDENCE-COVERAGE-POLICY.json), [policy schema](EVIDENCE-COVERAGE-POLICY.schema.json), and [report schema](EVIDENCE-COVERAGE-REPORT.schema.json).

The individual-record validator answers whether one public human result is internally valid and eligible for its narrow claim. It does not answer whether the project has covered every required task or prevent a reviewer from accidentally combining results from incompatible DSH, browser, terminal, AT, locale, or settings versions. This policy adds that aggregate boundary.

## Draft human-evidence baseline

The baseline has six profiles and twenty-six requirements:

| Profile | Required human coverage |
| --- | --- |
| Core Web and live states | Every claim-eligible core and live-state task with VoiceOver/Safari and NVDA/Chrome. |
| Accessible View | Every claim-eligible companion task with VoiceOver/Safari and NVDA/Chrome. |
| One-shot CLI | Every claim-eligible CLI task in VoiceOver and NVDA terminal environments. |
| Accessible authoring | Allow-once and rejection safety tasks with VoiceOver/Safari and NVDA/Chrome. |
| Extended assistive-technology matrix | Core Web coverage with JAWS/Chrome, Narrator/Edge, and Orca/Firefox; core Web coverage for braille, voice input, switch input, and magnification; plus CLI coverage with JAWS, Narrator, Orca, and braille. Modality-only rows still require a named, versioned technology in each evidence record. |
| Disabled-developer validation | One consented disabled-developer record per protocol must contain every representative core task for that protocol, completed independently, effectively, and safely. |

The exact task inventory comes from [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json). The coverage policy cannot reclassify tasks.

## Aggregation rules

AT records may combine only within one exact environment cohort. A cohort pins DSH and participating component versions/revisions, OS, browser or terminal and shell, access-technology versions/modalities, locale, input methods, and relevant settings. Records from VoiceOver 10 and 11, two browser versions, two DSH revisions, or different settings never fill one row together.

Disabled-developer coverage is stricter: every required task for one protocol must appear in one valid `a11y-user-validated` record. Public records intentionally contain no participant identity, so the aggregator never combines multiple records and implies that one person completed all tasks.

The generated report repeats only privacy-minimized cohort fields and public record IDs. It does not copy observations, settings text, participant data, or raw material.

## Run the report

```sh
pnpm run evidence:coverage
```

The command always validates the catalog, policy, and every discovered evidence record. Missing coverage is reported as structured `missing` rows and exits successfully, so an honest empty ledger does not make ordinary development CI fail.

A release or evidence-review workflow may require the complete draft baseline explicitly:

```sh
pnpm run evidence:coverage:require
```

That command exits nonzero while any requirement is missing. It is deliberately not part of ordinary CI yet because the repository has no real human record.

## Claim boundary

`baselineSatisfied: true` means only that this draft policy found all required rows without crossing its cohort boundaries. The report always carries `verdictScope: coverage-policy-only-not-release-readiness`. It does not prove participant diversity, tasks outside the current catalog, excluded platforms or modalities, or freedom from undiscovered barriers. It is not a WCAG/ATAG conformance claim, certification, universal accessibility statement, or release approval. A release still needs exact target-build compatibility, deterministic gates, privacy review, known limitations, maintainer review, and the release criteria in [ROADMAP.md](ROADMAP.md).

## Current status

The checked-in ledger contains one non-evidence template and zero human-evidence records. All twenty-six requirements therefore remain `missing`; this is an accurate program gap, not a validator failure.
