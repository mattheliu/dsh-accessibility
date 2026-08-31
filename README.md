# @oh-my-dsh/dsh-accessibility

English | [简体中文](README.zh.md)

An optional DeepSeek Harness companion for screen-reader guidance, semantic diagnostics, and an experimental user-loaded conversation reading view. It intentionally uses DSH slots and structured projections; it does not patch or observe hashed DOM classes.

This repository is also the public project hub of the [DSH Accessibility Working Group](https://github.com/omdsh-dev/community/blob/main/working-groups/accessibility.md). Its mission is to enable disabled developers to complete DSH's core tasks independently, effectively, and safely; help every developer produce more accessible digital content with DSH; and validate both goals with versioned standards, real assistive technology, and evidence from disabled users.

Project links: [Accessibility statement](ACCESSIBILITY_STATEMENT.md) · [Roadmap](ROADMAP.md) · [Governance](GOVERNANCE.md) · [Research protocol](RESEARCH.md) · [Human evidence ledger](HUMAN-EVIDENCE.md) · [Evidence task catalog](EVIDENCE-CATALOG.json) · [Aggregate coverage policy](EVIDENCE-COVERAGE.md) · [Accessible View RFC](RFC-ACCESSIBLE-VIEW.md) · [Browser evidence RFC](RFC-BROWSER-EVIDENCE.md) · [Authoring/testkit RFC](RFC-A11Y-AUTHORING.md) · [Authoring agent lab](AUTHORING-AGENT-LAB.md) · [Authoring AT lab](AUTHORING-AT-LAB.md) · [CLI accessibility protocol](CLI-ACCESSIBILITY.md) · [Core AT lab](AT-CORE-LAB.md) · [Live-announcement AT lab](AT-LIVE-LAB.md) · [Companion AT lab](AT-LAB.md) · [Contributing](CONTRIBUTING.md)

## Compatibility

The `0.1.0-beta.6` line targets exactly the `@deepseek-ai/dsh@0.1.1-rc.2` client package line plus the accessibility core patch tracked in [upstream Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546). Compatibility is deliberately version-scoped: a newer DSH release needs a fresh review before the peer range expands. The companion reports missing core semantics; it cannot safely replace focus traps, composite-widget keyboard behavior, landmarks, or live-region policy from outside the owning components.

## Install from npm

```sh
dsh plugin --profile web add @oh-my-dsh/dsh-accessibility@0.1.0-beta.6
dsh --profile web
```

The npm companion does not patch the owning DSH components. Until the changes are included in an official DSH release, use the organization-pinned [DSH accessibility build](https://github.com/omdsh-dev/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2-a11y.4) for the complete keyboard and screen-reader behavior:

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
cd deepseek-harness
git checkout dsh-v0.1.1-rc.2-a11y.4
pnpm install
pnpm run build:official
pnpm dsh plugin --profile web add @oh-my-dsh/dsh-accessibility@0.1.0-beta.6
pnpm dsh web
```

## Install from a checkout

```sh
pnpm install
pnpm run build
dsh plugin --profile web add file:.
dsh --profile web
```

Open Settings → Accessibility to run the current-page diagnostic and read the VoiceOver/NVDA/JAWS quick guide.

## Accessible View candidate

The current development branch also registers an experimental Accessible View through DSH's official `conversation.view` slot. It is not part of the published `0.1.0-beta.6` package and is not yet a stable-support claim.

Selecting the tab alone does not retain conversation content. Activate **Load reading view** to admit DSH's structured session snapshot. The view then presents finalized and in-progress records in source order, preserves semantic Markdown and code, offers explicit disclosures for context, reasoning, tool arguments/output, command input, and errors, and supports per-message copy plus older-history loading. **Clear reading view and return** unmounts the content and restores focus to Load.

This MVP remains read-oriented. Return to Chat to send, stop, approve, edit queued work, or use specialized tool controls. See [RFC-ACCESSIBLE-VIEW.md](RFC-ACCESSIBLE-VIEW.md) for the data-flow, threat review, exact limitations, and VoiceOver/NVDA validation procedure.

The assembled development gate also runs the candidate in Chromium, Firefox, and WebKit at 640 and 320 CSS px, samples focused controls against occluding content, audits reduced-motion behavior, and checks Chromium forced-color participation. These are versioned deterministic results, not real zoom, Windows High Contrast, assistive-technology, or disabled-user evidence. See [RFC-BROWSER-EVIDENCE.md](RFC-BROWSER-EVIDENCE.md).

## Diagnostics and scope

The page audit now runs 17 structural checks covering landmarks, the application heading, control names, image alternatives, list ownership, nested interactive controls, ARIA references, composer and log names, menus, listboxes, trees, radio groups, tab lists, dialogs, and adjustable separators. It recognizes the single-tab-stop/active-descendant patterns used by the patched DSH components and ignores static menu separators.

A passing result means that the mounted DOM satisfies these deterministic contracts. It is evidence, not a claim of complete conformance: it cannot prove spoken output, browser/accessibility-API mappings, focus timing, or Windows screen-reader behavior. Those still require the manual VoiceOver/NVDA/JAWS scenarios in the in-app guide.

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the assistive-technology matrix, manual regression protocol, and support boundary.

Consented human results use the versioned [human evidence ledger](HUMAN-EVIDENCE.md). Stable tasks and authoritative core, safety, and claim classifications come from the [evidence task catalog](EVIDENCE-CATALOG.json), not from the submitter. The validator preserves failed and partial observations while preventing stale, private, operationally assisted, unsafe, ineligible, unknown, or incomplete records from claiming `a11y-at-tested` or `a11y-user-validated`. The separate [aggregate coverage policy](EVIDENCE-COVERAGE.md) prevents incompatible exact environments from being combined and reports all missing primary and extended AT, CLI, companion, authoring, and disabled-developer rows. The ledger currently contains only a non-evidence template, so all twenty-six aggregate requirements are missing.

## CLI accessibility candidate

The `0.1.2-alpha.2` development line adds an explicit low-noise headless presentation and a versioned final JSON result. This repository owns the draft `dsh-cli-accessibility/1.0.0-draft` conformance protocol plus disposable automated and manual launchers. Automated process output is not screen-reader evidence; the manual launcher still requires a human speech or braille record. See [CLI-ACCESSIBILITY.md](CLI-ACCESSIBILITY.md).

## Accessible authoring candidate

The draft [authoring/testkit RFC](RFC-A11Y-AUTHORING.md) separates a pure versioned evidence engine, a development-only browser testkit, two independently reviewed page providers, an opt-in model-visible `a11y_check` adapter, and product composition. Five standalone local packages now cover both provider chains plus the first installable `dsh-a11y-local-preview/0.1.0-draft` DSH bundle. That bundle mounts the literal-loopback provider and read-only tool through the published DSH plugin lifecycle, advertises only normalized opaque target handles, rejects query/fragment secret carriers before mounting, and remains inert until a host supplies disposable loopback targets. Real Chromium, real loopback HTTP, published DSH `SystemPrompt`/`ToolRuntime`, bundle installation, config-dump, lifecycle disposal, privacy, and package-content tests pass locally. The versioned [authoring agent lab](AUTHORING-AGENT-LAB.md) proves one keyless real-product agent-loop task with the exact `a11y_check → read → edit → a11y_check` trace and a two-to-zero automated finding change. The separate [authoring AT lab](AUTHORING-AT-LAB.md) now makes that flow operable through the real DSH Web and approval UI, with automated allow-once and rejection safety gates plus a consented human VoiceOver/NVDA record format. Automated browser and Host results remain explicitly non-AT evidence. The five packages remain private and unpublished while review, live-model repair, listener-verified AT, and disabled-author gates stay open; a clean automated report is never represented as WCAG conformance.

## Checks

```sh
pnpm run evidence:validate
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --pack-destination ./artifacts
```

## Model Experience

The runtime companion in this branch adds no model-visible tools, prompts, messages, or context. The separately permissioned private authoring packages are not bundled into the companion.

## Security and privacy

Diagnostics inspect only the current document's semantic attributes in memory and never read conversation text. Accessible View reads the current structured conversation only after an explicit load action; sensitive technical sections require separate disclosure, and copying is a per-message system-clipboard action. Neither feature makes network requests, emits telemetry, or persists its own results or conversation copy.
