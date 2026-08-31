# Public evidence ledger

This directory contains only consented, de-identified JSON records governed by [the human evidence protocol](../HUMAN-EVIDENCE.md). Protocols, stable task IDs, representative-core classification, safety-critical classification, and claim eligibility come only from the versioned [evidence catalog](../EVIDENCE-CATALOG.json).

- `templates/` contains non-evidence starting points. A template must use `recordType: template`, `claim: none`, and `review.status: template`.
- `records/<year>/` is reserved for reviewed human records. Use `<recordId>.json`; one file covers one exact environment and task set.
- Failed and partial results are retained with `claim: none`. They are evidence of a barrier, not support claims.
- Raw research, contact information, consent artifacts, recordings, logs, private paths, and withdrawal routes never belong here.

Validate the entire ledger with `pnpm run evidence:validate`. A current record that passes its `validUntil` intentionally fails validation until it is repeated or marked expired/superseded.

[中文规程](../HUMAN-EVIDENCE.zh.md)
