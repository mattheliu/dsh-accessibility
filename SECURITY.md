# Security policy

The browser diagnostics inspect semantic attributes in the current document. They must not read conversation content, send telemetry, make network requests, or persist audit results.

The experimental Host authoring tool is disabled by default. When enabled, it must require non-empty configured roots, resolve and compare provider-owned canonical filesystem targets, fail closed when its default per-call approval cannot run, cap complete reads and findings, and remain read-only and offline. It must not load checked-project configuration or executable rules. Model explanations and repairs are not deterministic evidence and must use separate DSH mutation tools and policies.

See [RFC-A11Y-CHECK.md](RFC-A11Y-CHECK.md) for the data flow, threat model, rollback, extension trust boundary, and residual risks.

Report suspected vulnerabilities through GitHub private vulnerability reporting for `omdsh-dev/dsh-accessibility`. Do not include secrets, credentials, private conversations, or personal data in a public issue.

Supported security fixes are released on the latest npm version and documented in the changelog. Do not publish private source files, screen-reader transcripts containing personal data, or unredacted authoring reports as issue evidence.
