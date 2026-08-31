# Redacted diagnostic report protocol

[简体中文](DIAGNOSTIC-REPORT.zh.md) | English

Status: draft. Protocol: `dsh-accessibility-diagnostic/1.0.0-draft`. The normative machine contract is [DIAGNOSTIC-REPORT.schema.json](DIAGNOSTIC-REPORT.schema.json).

This protocol lets a developer explicitly copy a small, reviewable record of the companion's current-document structural checks. It is for local debugging and sanitized issue triage. It is not assistive-technology evidence, disabled-user evidence, a WCAG evaluation, or a conformance claim.

## User and privacy boundary

Nothing is copied, downloaded, persisted, or transmitted automatically. The report is created only after the developer runs the page diagnostic and activates **Copy redacted JSON report**. Clipboard failure is reported without falling back to another storage or network channel.

The exporter projects the internal result through an exact allowlist. It includes only the protocol, generation time, fixed scope and no-claim marker, summary counts, the seventeen stable check IDs with outcomes and affected counts, an explicit omission list, and fixed limitations. It excludes the page URL and title, DOM or HTML, selectors, IDs and classes, element or accessible names, conversation content, browser identity, screenshots, credentials, and raw errors. Unknown source properties are discarded. The user should still inspect the JSON before sharing because counts and timing can provide limited contextual information.

The separate focus inspector is deliberately outside this contract. Its ephemeral accessible-name snapshot can contain page content and must never be merged into the redacted report under `1.0.0-draft`.

## Interpretation

`passed` means only that one deterministic structural check found no matching issue in the current DOM state. `needs-attention` reports a count, not affected content or a selector. Neither outcome proves browser accessibility-API mapping, spoken or braille output, keyboard timing, cognitive usability, or WCAG conformance. Manual and real-assistive-technology evaluation remains required.

Changing a check ID, order, field, omission, limitation, or meaning requires a new protocol and Schema version. Adding private data to this report is never a backward-compatible change.
