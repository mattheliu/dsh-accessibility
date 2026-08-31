# Security policy

The Settings diagnostics inspect semantic attributes in the current document. They must not read conversation content, send telemetry, make network requests, or persist audit results.

## Diagnostic inspection and export boundary

Focus tracking is disabled by default and begins only after a user gesture. While active, it retains only the latest focus target outside its own panel and projects a bounded element tag, role, approximate accessible name and source, tab index, and allowlisted ARIA/native states. It must not retain class names, IDs, selectors, URLs, HTML, or a focus history. The snapshot is cleared on unmount and is never copied into the diagnostic report. Because an accessible name can contain page content, users must review it before capturing or sharing the screen.

The `dsh-accessibility-diagnostic/1.0.0-draft` exporter writes only after the user activates its Copy action. It canonicalizes the complete internal check set onto the strict [JSON Schema](DIAGNOSTIC-REPORT.schema.json), discards unknown fields, and excludes page and element data. Clipboard denial must fail visibly without falling back to downloads, storage, telemetry, or network transfer. See [DIAGNOSTIC-REPORT.md](DIAGNOSTIC-REPORT.md).

## Conversation-access boundary

The experimental Accessible View is the only companion surface on this branch authorized to read conversation content. It must:

- use DSH's version-pinned `conversation.view` and structured session snapshot contracts, never host DOM scraping or generated-class observation;
- select no conversation snapshot until the user activates the in-view Load action;
- delay mounting context, reasoning, tool arguments/output, command input, and raw errors until separate disclosure actions;
- avoid console output, telemetry, network transfer, URL encoding, browser storage, plugin persistence, diagnostic results, and automatic exports;
- make clipboard writes only from a message-level user gesture and exclude context, reasoning, tool material, source metadata, usernames, workspace paths, and environment metadata from that projection;
- use fixed localized live-error copy so paths and identifiers are not announced or logged by default;
- release its selected snapshot and disclosure tree when cleared or unmounted.

Clearing cannot delete DSH's source history or revoke data already written to the operating-system clipboard. A visible user or assistant message may itself contain sensitive text, so users must treat Copy as an explicit export. Full data-flow and threat review are in [RFC-ACCESSIBLE-VIEW.md](RFC-ACCESSIBLE-VIEW.md).

Loading older history uses the current session's existing read privilege. The companion must not add filesystem, workspace, model, tool, recording, or background network privileges for this feature.

## Evidence handling

Public fixtures and evidence must be synthetic and de-identified. Do not place real prompts, model output, usernames, absolute paths, environment identifiers, credentials, tokens, contact details, disability information, or raw research recordings in tests, issues, pull requests, logs, screenshots, or public CI artifacts.

Report suspected vulnerabilities through GitHub private vulnerability reporting for `omdsh-dev/dsh-accessibility`. Do not include secrets, credentials, private conversations, or personal data in a public issue.

Supported security fixes are released on the latest npm version and documented in the changelog.
