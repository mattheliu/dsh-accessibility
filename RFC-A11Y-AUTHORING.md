# RFC: deterministic accessibility authoring support

[简体中文](RFC-A11Y-AUTHORING.zh.md) | English

Status: draft. Protocols: `dsh-a11y-testkit/0.1.0-draft` and `dsh-a11y-authoring/0.1.0-draft`.

## Problem

DSH should help authors find and repair accessibility barriers without claiming that an automated scan proves WCAG conformance. The implementation must also remain usable by disabled developers, avoid silently reading or publishing sensitive product content, and preserve DSH's existing filesystem, network, sandbox, and approval boundaries.

The design follows [WCAG 2.2](https://www.w3.org/TR/WCAG22/) as the Web content target and [ATAG 2.0](https://www.w3.org/TR/ATAG20/) as authoring-tool guidance. ATAG Part A covers the accessibility of DSH itself; Part B covers guiding authors, checking content, locating findings, reporting status, and offering repair assistance. Rule metadata is shaped by the transparency goals of [ACT Rules Format 1.1](https://www.w3.org/TR/act-rules-format/), but provider rules are not called ACT Rules unless they satisfy that specification. A complete conformance statement requires the scoped sampling, expert evaluation, reporting, and continuing validity described by [WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/); automated results alone never create that statement.

## Goals and non-goals

The first release must:

- run deterministic checks against an explicitly selected rendered page;
- return a versioned, machine-readable report with provider/rule versions, WCAG mappings, outcomes, locations, repair help, limitations, and counts;
- distinguish detected failures from items needing human review;
- omit page HTML, screenshots, cookies, credentials, and response bodies from the report by default;
- let local tests and CI consume the same engine without loading a DSH runtime;
- let a future model-visible `a11y_check` adapter request the scan without acquiring mutation authority; and
- preserve enough location information for an author to find a problem while warning that selectors may contain project data.

It does not certify a page, site, application, organization, or release; replace manual keyboard, screen-reader, low-vision, cognitive, speech, switch, or disabled-user evaluation; judge whether alternative text is contextually appropriate; or silently repair source code.

## Three release and trust boundaries

| Boundary | Responsibility | Authority | Distribution |
| --- | --- | --- | --- |
| Deterministic engine | Normalize provider results into a stable report and enforce evidence wording | Pure data transformation; no filesystem, browser, network, clipboard, or process access | Small library owned by the testkit |
| `dsh-a11y-testkit` | Start or receive an isolated browser page, run pinned deterministic providers, and emit the versioned report | Development/CI process; no DSH model tools | Separate development dependency and CLI |
| `a11y_check` adapter | Expose a bounded read-only scan to a DSH agent and render actionable findings | Existing DSH tool policy plus explicit browser/network approval; no write method | Separate opt-in DSH plugin |

The runtime companion remains responsible for DSH's own diagnostics and accessible UI. It must not gain general browser automation, workspace scanning, or model-visible tools merely because it hosts the program documentation.

## Report contract

One run emits a single `dsh-a11y-testkit/0.1.0-draft` object:

```json
{
  "protocol": "dsh-a11y-testkit/0.1.0-draft",
  "generatedAt": "2026-08-31T00:00:00.000Z",
  "subject": { "kind": "page", "label": "local-page" },
  "engine": { "name": "axe-core", "version": "4.x" },
  "standards": ["WCAG 2.2 A", "WCAG 2.2 AA"],
  "summary": { "failed": 1, "needsReview": 0, "passedRules": 0, "inapplicableRules": 0 },
  "findings": [],
  "limitations": []
}
```

Each finding has a provider rule ID, `failed` or `needs-review` outcome, impact when the provider supplies it, standards tags, help text and URL, and one or more locations. Locations contain provider selectors by default and never include serialized HTML. Raw provider output is not the public protocol: adding or upgrading a provider cannot silently reshape reports.

`passedRules` means only that the provider reported a pass for its own rule on this tested page state. A WCAG success criterion does not become “passed” merely because one automated rule passes. Empty `findings` means “no findings from these rules in this state,” never “accessible” or “WCAG compliant.”

Breaking field or meaning changes require a new protocol version. Provider upgrades are separately visible in `engine.version` and require fixture review.

## Testkit execution boundary

The library accepts a Playwright-compatible page that the caller already owns. It injects the pinned local provider asset and receives structured results. The first implementation does not navigate, start a server, read a workspace, attach cookies, take screenshots, or upload anything. This keeps the reusable engine hermetic and lets each product test own its authenticated state and disclosure decision.

A later CLI may navigate only to loopback HTTP(S) by default. Remote origins, custom headers, persisted browser profiles, authentication state, cross-origin resource access, downloads, pop-ups, and service workers require explicit design and approval. A CLI or adapter must use a new temporary browser profile, bound time and output, close all contexts, and never print a signed URL.

## Model-visible `a11y_check` boundary

The future opt-in tool has one responsibility: request a scan and return the bounded report plus repair guidance. It does not edit files. Source changes continue through DSH's existing read/edit tools, sandbox policy, observed-version checks, diff presentation, and user approvals.

The minimum call identifies a caller-owned local page handle or loopback URL and an optional standards/rule selection. The adapter must:

1. resolve the target through an injected browser-audit service rather than importing a concrete browser or filesystem backend;
2. fail closed if no compatible isolated provider is mounted;
3. reject credentials in URLs, arbitrary request headers, cookies, filesystem URLs, `data:` URLs, and non-loopback navigation unless a separately advertised approval path exists;
4. propagate cancellation and enforce configured time, page, finding, node, and byte caps;
5. return provider failures as tool errors without converting them into a clean report;
6. label every automated outcome and limitation in model-visible text; and
7. register no write, fix, certification, score, or “make compliant” operation.

Repair help names the affected requirement, location, why it matters, what evidence is still needed, and one or more author choices. It must not generate generic or filename-based alternative text. Any proposed alternative must remain editable and require the author to accept, modify, or reject it before insertion, following ATAG 2.0 B.2.3.2.

## Privacy and threat model

Rendered pages and selectors may contain confidential product data. Reports therefore use a caller-supplied non-sensitive subject label, exclude DOM snippets by default, and stay local unless the caller deliberately stores them. Public evidence must be redacted under [RESEARCH.md](RESEARCH.md).

The browser treats the page as hostile. The owning runner must isolate its profile, disable downloads and unintended external navigation, contain pop-ups, close the context after the run, and apply network policy before page content executes. The authoring adapter must not inherit the user's normal browser profile or ambient authentication. A page can still reveal data through resources it is allowed to request, so loopback-only navigation is not equivalent to content isolation.

Selectors can expose names, IDs, test data, or application structure. They are necessary for programmatic association and local repair, but public exporters must provide a review/redaction step or replace them with stable local finding IDs.

## Evidence and release gates

The deterministic engine requires unit fixtures for failed, needs-review, passed, inapplicable, malformed, oversized, and provider-error inputs. The browser adapter requires assembled tests against accessible and intentionally failing pages, exact package-content tests, cancellation/cleanup checks, and a privacy assertion proving serialized HTML is absent.

The model-visible adapter additionally requires DSH tool-schema snapshots, filesystem/network denial tests, approval tests for every expanded authority, cancellation and output-retention tests, prompt-language review, and a real agent task showing that a developer can locate and repair a finding without the tool editing anything itself.

Stable authoring support still requires disabled developers to use the complete flow, named assistive technologies to read the report and repair interaction, and manual review of issues automation cannot decide. Test counts, an axe score, or a clean automated run are insufficient release evidence.

## Rollout

1. Publish the pure report contract and the first page-audit testkit as an experimental development package.
2. Migrate the companion's assembled-browser assertions to consume the testkit without changing their evidence scope.
3. Add a loopback-only CLI after navigation and cleanup policy tests exist.
4. Implement the opt-in `a11y_check` DSH adapter against an injected audit service, not directly against Playwright.
5. Validate report reading and repair with VoiceOver and NVDA, then with disabled developers completing representative authoring tasks.
6. Expand beyond rendered Web pages only through separately versioned rules, evidence, and permission reviews.
