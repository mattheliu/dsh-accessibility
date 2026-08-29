# @oh-my-dsh/dsh-accessibility

English | [简体中文](README.zh.md)

An optional DeepSeek Harness companion that adds a Settings page with screen-reader operating guidance and semantic diagnostics. The current source also contains an experimental, permissioned static-HTML authoring check. It intentionally uses DSH slots and does not patch or observe hashed DOM classes.

This repository is also the public project hub of the [DSH Accessibility Working Group](https://github.com/omdsh-dev/community/blob/main/working-groups/accessibility.md). Its mission is to enable disabled developers to complete DSH's core tasks independently, effectively, and safely; help every developer produce more accessible digital content with DSH; and validate both goals with versioned standards, real assistive technology, and evidence from disabled users.

Project links: [Accessibility statement](ACCESSIBILITY_STATEMENT.md) · [Roadmap](ROADMAP.md) · [Governance](GOVERNANCE.md) · [Research and evidence protocol](RESEARCH.md) · [Contributing](CONTRIBUTING.md)

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

## Diagnostics and scope

The page audit now runs 17 structural checks covering landmarks, the application heading, control names, image alternatives, list ownership, nested interactive controls, ARIA references, composer and log names, menus, listboxes, trees, radio groups, tab lists, dialogs, and adjustable separators. It recognizes the single-tab-stop/active-descendant patterns used by the patched DSH components and ignores static menu separators.

A passing result means that the mounted DOM satisfies these deterministic contracts. It is evidence, not a claim of complete conformance: it cannot prove spoken output, browser/accessibility-API mappings, focus timing, or Windows screen-reader behavior. Those still require the manual VoiceOver/NVDA/JAWS scenarios in the in-app guide.

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the assistive-technology matrix, manual regression protocol, and support boundary.

## Experimental accessible-authoring preview

The unreleased source branch can add a Host-side `a11y_check` tool. It is disabled by default and does not appear to the model until a profile both enables it and supplies one or more explicit roots. The default mode asks before every read:

```yaml
# User-layer cordis.patch.yml
- id: accessibility
  config:
    authoring:
      enabled: true
      access: approval
      allowedRoots:
        - ./examples/a11y-check
```

The tool reads one regular UTF-8 HTML file, runs the pinned offline `html-validate@11.4.0` configuration, and returns report schema `1.0.0`. It cannot write, upload, use project-supplied rules, or certify accessibility. Model explanations and repair suggestions are separate; approved changes use DSH's normal edit/write tools. See the complete [permission, threat, result, and extension RFC](RFC-A11Y-CHECK.md) and [synthetic workflow](examples/a11y-check/README.md).

## Checks

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --pack-destination ./artifacts
```

## Model Experience

With the default configuration, this package adds no model-visible tools, prompts, messages, or context. When an administrator explicitly enables authoring with non-empty roots, it adds only `a11y_check`; the canonical result states that automated checking ran while assistive-technology and disabled-user validation did not.

## Security and privacy

Browser diagnostics inspect the current document's semantic attributes in memory. They do not read conversation text, make network requests, or persist results. The optional Host authoring check reads only canonical paths inside configured roots, asks by default, applies a byte cap, performs no network or file mutation, and does not persist results.
