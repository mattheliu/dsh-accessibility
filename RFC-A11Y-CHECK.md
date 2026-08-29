# RFC: permissioned accessibility authoring and `a11y_check`

Status: experimental implementation for public review

Report schema: `1.0.0`

Built-in engine: `html-validate@11.4.0`, configuration `web-static-1`

DSH API baseline: `0.1.1-rc.2`

Tracking issue: [omdsh-dev/dsh-accessibility#13](https://github.com/omdsh-dev/dsh-accessibility/issues/13)

## Decision

DSH may expose an opt-in `a11y_check` Host tool that reads one authorized static HTML file and returns a deterministic, versioned evidence report. The tool is disabled by default. Enabling it requires at least one explicit root. The default access mode also asks the user before each read. The first engine runs offline, uses a package-owned rule configuration, and cannot write files.

Detection is separate from model interpretation and remediation. The engine reports what a pinned rule found. A model may explain a finding or propose a change, but any change goes through a different DSH write/edit tool and its policy. `a11y_check` never silently rewrites, uploads, or publishes content.

This RFC does not define accessibility certification. A passing automated report cannot establish WCAG conformance, browser/accessibility-API interoperability, successful assistive-technology output, or disabled-user usability.

## Scope and boundaries

Version 1 accepts only `web-static`: a regular UTF-8 HTML file. It does not execute JavaScript, render a DOM, load CSS or images, follow URLs, use checked-project configuration, or run checked-project plugins. Page URLs, screenshots, native mobile applications, PDFs, office documents, design files, and live application trees are unsupported. Each future source kind requires its own permission contract, deterministic provider, threat review, limitations, and evidence protocol before it can enter this schema.

The existing browser diagnostic remains a local current-DOM check. The Host authoring service is a separate capability and gives the browser companion no implicit workspace access.

## Permission contract

The feature uses two independent keys:

1. A DSH profile must set `authoring.enabled: true` and provide a non-empty `authoring.allowedRoots` list.
2. In the default `approval` mode, DSH's `tools/pre-execute` gate asks for one-time approval before content is read. If approval support is absent, the call is denied.

Every configured root and requested file is resolved by `ctx.fs`. Containment is tested on the provider's canonical targets with `ctx.fs.contains`; string-prefix comparison is not used. A configured root must resolve to an existing directory. Relative roots and file paths use the calling session's working directory. Traversal and symlink aliases that resolve outside every root are denied before a content read.

`allowlist` mode removes the per-call prompt but never removes canonical root containment. It is intended only for a deliberately narrow, reviewed profile. `maxBytes` bounds the complete read and `maxFindings` bounds the returned finding list. The tool has no network client and no mutation method.

Example user-layer `cordis.patch.yml`:

```yaml
- id: accessibility
  config:
    authoring:
      enabled: true
      access: approval
      allowedRoots:
        - ./examples/a11y-check
      maxBytes: 1048576
      maxFindings: 200
```

Disable or roll back by removing that `config` block or setting `authoring.enabled: false`. The implementation keeps no authoring database, writes no file, and persists no check result, so rollback requires no data migration.

## Data flow

1. The model or user supplies `file_path`; argument validation rejects a missing or non-string value.
2. The pre-execution gate resolves all roots and the target, verifies directory roots and canonical containment, then requests approval when configured.
3. After authorization, the body stats the target, requires a regular file, enforces the byte cap, reads bytes, records their byte length and SHA-256 identity, and decodes strict UTF-8.
4. The consumer passes only `{kind, display path, content}` to registered authoring engines. The built-in engine receives no filesystem or network capability.
5. All applicable engines must finish. Any provider failure rejects the call; the service does not present partial output as complete evidence.
6. The service sorts engines and findings deterministically, applies the finding cap, and emits report schema `1.0.0`.
7. DSH presents the report. No content or report is uploaded or persisted by this package.

## Deterministic engine

`web-static-1` pins `html-validate@11.4.0` exactly and declares every enabled rule in package code. It does not use `extends`, a project `.htmlvalidate.*` file, project modules, or remote configuration. Rule ids are checked against the installed engine at startup. Findings carry engine id, exact engine version, configuration version, rule id, severity, source position, documentation URL when supplied by the engine, and package-owned standards references.

The rules detect selected HTML and ARIA source defects, including missing alternatives and labels, empty headings/titles, unresolved references, focusable hidden content, autoplay, invalid roles, landmark structure, and several WCAG HTML techniques. The inventory is exported as `HTML_VALIDATE_RULES`; changing its semantics requires a new configuration version.

The standards mapping points reviewers to [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WCAG techniques](https://www.w3.org/WAI/WCAG22/Techniques/), [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/), and the [HTML Living Standard](https://html.spec.whatwg.org/). A rule-to-criterion link is navigation and traceability, not a claim that one rule exhaustively tests a success criterion. Engine behavior is documented by the [html-validate API](https://html-validate.org/guide/api/getting-started.html) and [rule reference](https://html-validate.org/rules/).

## Result schema and evidence classes

The canonical result is enforced by DSH's tool-output boundary. Representative shape:

```json
{
  "schemaVersion": "1.0.0",
  "target": {
    "kind": "web-static",
    "path": "/authorized/example.html",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "byteLength": 0
  },
  "authorization": {
    "mode": "configured-root+approval",
    "configuredRootCount": 1,
    "approval": "allowed-once",
    "readOnly": true,
    "network": "none"
  },
  "engines": [
    { "id": "html-validate", "version": "11.4.0", "configVersion": "web-static-1", "findingCount": 2 }
  ],
  "outcome": "fail",
  "summary": { "errors": 1, "warnings": 1, "totalFindings": 2 },
  "findings": [],
  "findingsTruncated": false,
  "evidence": {
    "automated": "completed",
    "assistiveTechnology": "not-run",
    "disabledUser": "not-run"
  },
  "uncertainty": {
    "automatedCoverage": "partial",
    "renderedBehavior": "not-observed",
    "humanJudgment": "required"
  },
  "humanReviewRequired": [],
  "limitations": [],
  "certification": false
}
```

`error` means the pinned configuration treats the rule as a blocking source defect. `warning` is deterministic advisory output. Requirements involving alternative quality, computed contrast, keyboard and dynamic state, focus, rendered layout, announcements, AT interoperability, safety, comprehension, or task completion remain in `humanReviewRequired` rather than being guessed by the engine.

The target digest, byte length, exact engines, and configuration versions identify the input and mechanism needed for a repeat run; evidence systems should additionally retain the command, package lock, platform, and source revision. The report always distinguishes three evidence classes: automated, named real assistive-technology testing, and consented disabled-user task validation. This implementation can complete only the first. It therefore always returns explicit partial-coverage uncertainty, `assistiveTechnology: not-run`, `disabledUser: not-run`, and `certification: false`.

## Trusted extension API

An installed Host plugin may register an `AccessibilityEngine` with `ctx.accessibilityAuthoring.registerEngine(engine)`. An engine declares a stable lowercase id, exact implementation version, configuration version, supported source kinds, and an asynchronous deterministic check. Duplicate or malformed providers are rejected. Registration is scoped to the plugin lifecycle.

Engines are trusted installed code. A checked repository, page, model argument, or report cannot name a module to load. Providers receive only an already-authorized source object and cancellation signal; permission acquisition stays in the owning consumer. A provider for a new source kind must not reuse `web-static` to bypass a new permission and evidence review.

## Threat model

| Threat | Control | Residual limitation |
| --- | --- | --- |
| Path traversal, prefix confusion, or symlink escape | Provider-owned resolution and canonical `contains`; roots must be directories; check occurs before read | Security still depends on the configured filesystem provider preserving its target/containment contract |
| Accidental broad workspace access | Feature disabled by default; non-empty roots; default per-call approval | An administrator can deliberately choose a broad root or `allowlist` mode |
| Private-source exfiltration | No network capability, telemetry, upload, or project rule loading; report persistence is not implemented | Other separately installed DSH tools retain their own permissions |
| Prompt injection in checked content | Engine treats content as source text; content is not added as a prompt by this package | A later model explanation must avoid echoing secrets and remains model output |
| Malicious project config/plugin | Fixed in-package configuration; no project config, `extends`, or project module loading | Trusted installed engine providers execute with their plugin's Host authority |
| Resource exhaustion | Regular-file check, byte cap, finding cap, cancellation propagation | HTML validation still consumes CPU within those bounds |
| Partial or stale evidence presented as complete | Provider failure rejects; exact engine/config versions and truncation are recorded | Consumers must retain the report and source revision together if they persist evidence elsewhere |
| Automated pass misrepresented as conformance | Explicit evidence fields, human-review list, limitations, and `certification: false` | Documentation and downstream UIs must preserve these fields and language |
| Unreviewed automatic repair | Check tool has no write method; remediation uses separate normal DSH tools and policies | Users may still approve a poor model suggestion; review and verification remain required |

## Acceptance and release policy

The implementation is acceptable for an experimental release only when type checks, unit tests, build, package inspection, permission-negative tests, deterministic fixtures, and documentation checks pass. Stable support additionally requires privacy review, at least one disabled developer review of the workflow, and versioned real AT and disabled-user evidence for the relevant DSH core tasks. Findings from those reviews can revise the schema or permission model; implementation completion alone does not close the evidence gate.

The public sample in [`examples/a11y-check`](examples/a11y-check/README.md) demonstrates detection, separate explanation/suggestion, user-controlled repair, and deterministic re-check. It deliberately ends with the remaining AT and disabled-user work instead of a “fully accessible” claim.
