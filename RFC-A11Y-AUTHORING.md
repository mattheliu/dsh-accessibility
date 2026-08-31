# RFC: deterministic accessibility authoring support

[简体中文](RFC-A11Y-AUTHORING.zh.md) | English

Status: draft. Protocols: `dsh-a11y-testkit/0.1.0-draft`, `dsh-a11y-loopback-provider/0.1.0-draft`, `dsh-a11y-authoring/0.1.0-draft`, and `dsh-a11y-local-preview/0.1.0-draft`.

Implementation status: five private local packages now implement the deterministic testkit, a caller-owned-page provider, a separately versioned literal-loopback provider, the read-only DSH adapter, and an installable literal-loopback product composition. Both provider chains are assembled against real Chromium and the published `0.1.2-alpha.2` DSH `ToolRuntime`; the product composition additionally passes real DSH profile installation, config-dump, plugin loading, SystemPrompt target inventory, lifecycle, privacy, and package-artifact checks. Review and remote publication, a host composition for the caller-owned-page path, real-agent repair, real assistive-technology evidence, and disabled-author task evidence remain open release gates.

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
- let an opt-in model-visible `a11y_check` adapter request the scan without acquiring mutation authority; and
- preserve enough location information for an author to find a problem while warning that selectors may contain project data.

It does not certify a page, site, application, organization, or release; replace manual keyboard, screen-reader, low-vision, cognitive, speech, switch, or disabled-user evaluation; judge whether alternative text is contextually appropriate; or silently repair source code.

## Six release and trust boundaries

| Boundary | Responsibility | Authority | Distribution |
| --- | --- | --- | --- |
| Deterministic engine | Normalize provider results into a stable report and enforce evidence wording | Pure data transformation; no filesystem, browser, network, clipboard, or process access | Small library owned by the testkit |
| `dsh-a11y-testkit` | Receive a caller-owned browser page, run pinned deterministic providers, and emit the versioned report | Development/CI process; no DSH model tools | Separate development dependency |
| Caller-owned-page provider | Map an exact pre-registered opaque handle to only the testkit's injection/evaluation page surface; bound waiting, cancellation, revocation, and concurrency | No discovery, creation, navigation, URL read, authentication, screenshot, HTML serialization, download, close, filesystem, or process authority | Separate opt-in provider package |
| Literal-loopback provider | Map an opaque host registration to one literal-loopback URL, own a fresh browser context, constrain network/browser actions, run the testkit, and close every owned context | Chromium process plus bounded GET/HEAD/OPTIONS access to one host-approved literal-loopback origin; no model-supplied URL, DNS name, authentication, cross-origin request, WebSocket forwarding, persistent profile, download, screenshot, or HTML serialization | Separate opt-in provider package and versioned policy |
| `a11y_check` adapter | Expose a bounded read-only scan to a DSH agent and render actionable findings | Existing DSH tool policy plus explicit browser/network approval; no write method | Separate opt-in DSH plugin |
| Product composition | Validate trusted host mappings, mount exactly one provider and adapter, and advertise only model-safe handles through the DSH lifecycle | Only the authority of the selected provider; no extra navigation, mutation, target discovery, URL disclosure, or certification authority | Separate default-inert DSH profile bundle with its own protocol |

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

## Caller-owned-page provider boundary

The initial private provider accepts a page created and owned by a trusted host and retains a new wrapper containing only `addScriptTag` and `evaluate`. The host registers one exact opaque handle and an explicitly model-visible subject label. The provider does not enumerate targets to the model, inspect extra page methods, read a URL, or close the page. It permits one audit per handle at a time, rejects unknown and duplicate handles without revealing the registry, bounds model-visible waiting, and propagates caller cancellation and registration revocation.

Because this provider deliberately cannot close a caller-owned page, a timed-out or cancelled underlying evaluation may continue until the page or operation settles. The handle remains busy for that actual lifetime, and the host retains responsibility for stronger cancellation and page cleanup. The separately implemented literal-loopback provider is an independent authority expansion with its own policy and lifecycle evidence.

## Literal-loopback provider boundary

`dsh-a11y-loopback-provider/0.1.0-draft` maps an opaque handle registered by the trusted host to an HTTP(S) URL whose host is exactly the literal `127.0.0.1` or `[::1]`. It rejects `localhost`, DNS names, credentials, file and data URLs, shorthand and alternative loopback addresses, and remote hosts before launching a browser. The URL and query never enter the tool schema, model call, report subject, or privacy-safe provider error.

Each run launches or reuses only the provider's headless Chromium process, then creates a fresh non-persistent context with downloads disabled and service workers blocked. Context-wide HTTP routing permits only GET, HEAD, and OPTIONS on the registration's exact origin; redirects and subresources to another scheme, host, or port are aborted. WebSockets are closed without connecting. Authorization, Cookie, proxy-authorization, and API-key headers are removed or emptied before allowed requests continue. Pop-ups are closed, dialogs dismissed, and downloads cancelled. Browser-controlled referrers can return only to the already approved origin because cross-origin requests are blocked.

Caller cancellation, registration revocation, deadline expiry, and provider disposal close the owned context and return fixed errors that do not retain raw Playwright messages or registered URLs. One target cannot be audited concurrently, and the provider has a bounded total concurrency. A blocked-action count and the exact provider policy version are appended to report limitations.

This is containment, not proof of harmlessness. A hostile local page can consume resources, exploit a browser vulnerability, send data to another endpoint on its approved origin, or trigger server-side effects through GET. Runs therefore require a disposable unprivileged server and test data. Authentication, cross-origin APIs, unsafe methods, WebSocket forwarding, remote browser endpoints, persisted profiles, arbitrary launch arguments, and browser-engine expansion remain separate authority changes and cannot be added under this protocol version.

## Model-visible `a11y_check` boundary

The initial private opt-in tool implementation has one responsibility: request a scan and return the bounded report plus repair guidance. It does not edit files. Source changes continue through DSH's existing read/edit tools, sandbox policy, observed-version checks, diff presentation, and user approvals. Both providers exercise this boundary in assembled tests; the literal-loopback path additionally has the separate product composition below.

The minimum call identifies an exact caller-owned opaque page handle and an optional subtree selector. The model never supplies a URL. The separately mounted provider may map that host-created handle to either a caller-owned page or a policy-approved literal-loopback page. The adapter must:

1. resolve the target through an injected browser-audit service rather than importing a concrete browser or filesystem backend;
2. fail closed if no compatible isolated provider is mounted;
3. reject URLs and filesystem paths at the tool boundary; the literal-loopback mapping separately rejects credentials, arbitrary request headers, cookies, file and `data:` URLs, DNS names, cross-origin requests, unsafe methods, and non-loopback navigation;
4. propagate cancellation and enforce configured time, page, finding, node, and byte caps;
5. return provider failures as tool errors without converting them into a clean report;
6. label every automated outcome and limitation in model-visible text; and
7. register no write, fix, certification, score, or “make compliant” operation.

Repair help names the affected requirement, location, why it matters, what evidence is still needed, and one or more author choices. It must not generate generic or filename-based alternative text. Any proposed alternative must remain editable and require the author to accept, modify, or reject it before insertion, following ATAG 2.0 B.2.3.2.

## Local-preview product composition boundary

`dsh-a11y-local-preview/0.1.0-draft` is a private, default-inert DSH profile bundle and Cordis plugin. A trusted profile may configure one to eight exact mappings from normalized opaque handles to literal-loopback targets. The plugin validates every mapping before creating the provider, rejects duplicates and URL query strings or fragments, mounts the versioned loopback provider, registers the read-only adapter, and contributes one SystemPrompt runtime-context record containing only the composition protocol and handle list. Target URLs, paths, subject labels, ready selectors, cookies, credentials, headers, browser errors, screenshots, HTML, and filesystem paths are absent from that inventory and the tool schema.

The bundle's shipped row is disabled and carries no active target. A later trusted profile patch must restate the complete config and enable it. The host, not the plugin, owns preview-server start, readiness, shutdown, logs, and retained data. The installation guide therefore requires a disposable, unprivileged server and test data; it does not turn the provider into a server launcher or grant authenticated access. Plugin disposal revokes the target inventory, tool registration, provider registrations, active browser contexts, and owned browser process through the same DSH lifecycle.

Current evidence loads the package through the real Cordis plugin API with published DSH SystemPrompt and ToolRuntime packages, runs a real loopback HTTP fixture and Chromium audit, verifies injection-like labels and private configuration do not enter the target inventory, tests pre-mount rejection and disposal, parses the bundle artifact, installs the local checkout through `dsh plugin`, composes an enabling patch through `dsh --dump-config`, and boots the headless product entry. This remains pre-release evidence, not a stable support or conformance claim.

## Privacy and threat model

Rendered pages and selectors may contain confidential product data. Reports therefore use a caller-supplied non-sensitive subject label, exclude DOM snippets by default, and stay local unless the caller deliberately stores them. Public evidence must be redacted under [RESEARCH.md](RESEARCH.md).

The browser treats the page as hostile. The owning runner must isolate its profile, disable downloads and unintended external navigation, contain pop-ups, close the context after the run, and apply network policy before page content executes. The authoring adapter must not inherit the user's normal browser profile or ambient authentication. The initial loopback provider implements these controls for one literal origin and includes blocked-action evidence, but a page can still reveal data to allowed same-origin endpoints, so loopback-only navigation is not equivalent to content isolation.

Selectors can expose names, IDs, test data, or application structure. They are necessary for programmatic association and local repair, but public exporters must provide a review/redaction step or replace them with stable local finding IDs.

## Evidence and release gates

The deterministic engine requires unit fixtures for failed, needs-review, passed, inapplicable, malformed, oversized, and provider-error inputs. The browser adapter requires assembled tests against accessible and intentionally failing pages, exact package-content tests, cancellation/cleanup checks, and a privacy assertion proving serialized HTML is absent.

The model-visible adapter and product composition additionally require DSH tool-schema snapshots, target-inventory privacy tests, filesystem/network denial tests, approval tests for every expanded authority, cancellation and output-retention tests, prompt-language review, exact installable-artifact checks, and a real agent task showing that a developer can locate and repair a finding without the tool editing anything itself.

Stable authoring support still requires disabled developers to use the complete flow, named assistive technologies to read the report and repair interaction, and manual review of issues automation cannot decide. Test counts, an axe score, or a clean automated run are insufficient release evidence.

## Rollout

1. Publish the pure report contract and the first page-audit testkit as an experimental development package.
2. Migrate the companion's assembled-browser assertions to consume the testkit without changing their evidence scope.
3. Review the implemented literal-loopback provider policy and lifecycle evidence; add a loopback-only CLI only after defining who owns server startup, readiness, shutdown, logs, and retained output.
4. Review the implemented private literal-loopback product composition and define a separately permissioned host composition for the caller-owned-page provider; both paths must retain the injected audit service instead of importing Playwright in the model adapter.
5. Validate report reading and repair with VoiceOver and NVDA, then with disabled developers completing representative authoring tasks.
6. Expand beyond rendered Web pages only through separately versioned rules, evidence, and permission reviews.
