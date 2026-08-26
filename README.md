# @oh-my-dsh/dsh-accessibility

English | [简体中文](README.zh.md)

An optional DeepSeek Harness companion that adds a Settings page with screen-reader operating guidance and semantic diagnostics. It intentionally uses DSH slots and does not patch or observe hashed DOM classes.

## Compatibility

The `0.1.0-beta.3` line targets `@deepseek-ai/dsh@0.1.1-rc.2` plus the accessibility core patch tracked in [upstream Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546). The companion reports missing core semantics; it cannot safely replace focus traps, composite-widget keyboard behavior, landmarks, or live-region policy from outside the owning components.

## Install from npm

```sh
dsh plugin --profile web add @oh-my-dsh/dsh-accessibility
dsh --profile web
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

The page audit now runs 14 structural checks covering landmarks, control names, image alternatives, ARIA references, composer and log names, menus, listboxes, trees, radio groups, tab lists, dialogs, and adjustable separators. It recognizes the single-tab-stop/active-descendant patterns used by the patched DSH components and ignores static menu separators.

A passing result means that the mounted DOM satisfies these deterministic contracts. It is evidence, not a claim of complete conformance: it cannot prove spoken output, browser/accessibility-API mappings, focus timing, or Windows screen-reader behavior. Those still require the manual VoiceOver/NVDA/JAWS scenarios in the in-app guide.

## Checks

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --pack-destination ./artifacts
```

## Model Experience

This package adds no model-visible tools, prompts, messages, or context. It changes only the local Web UI settings surface.

## Security and privacy

Diagnostics inspect the current document's semantic attributes in memory. They do not read conversation text, make network requests, or persist results.
