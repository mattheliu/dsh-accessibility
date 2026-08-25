# dsh-accessibility

English | [简体中文](README.zh.md)

An optional DeepSeek Harness companion that adds a Settings page with screen-reader operating guidance and semantic diagnostics. It intentionally uses DSH slots and does not patch or observe hashed DOM classes.

## Compatibility

The `0.1.0-beta.1` line targets `@deepseek-ai/dsh@0.1.1-rc.2` plus the accessibility core patch tracked in [upstream Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546). The companion reports missing core semantics; it cannot safely replace focus traps, tree keyboard behavior, landmarks, or live-region policy from outside the owning components.

## Install from a checkout

```sh
pnpm install
pnpm run build
dsh plugin --profile web add file:.
dsh --profile web
```

Open Settings → Accessibility to run the current-page diagnostic and read the VoiceOver/NVDA/JAWS quick guide.

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
