# Contributing

Contributions that improve screen-reader interoperability, keyboard operation, diagnostics, documentation, or test evidence are welcome.

[简体中文](CONTRIBUTING.zh.md) | English

Organization membership is not required. Use the accessibility-barrier form for product defects and the assistive-technology test form for AT evidence. Architecture proposals should identify whether work belongs in DSH core, the runtime companion, a development testkit, the external AT lab, or a separately permissioned model-visible authoring tool.

## Local checks

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
npm pack --dry-run
```

Behavior changes must include deterministic tests. Changes to support claims must update both accessibility documents and identify the exact browser, assistive-technology version, language, scenario, spoken result, and focus result. Automated checks do not count as manual screen-reader certification.

For real AT observation, use the [core lab](AT-CORE-LAB.md) for static core tasks, the [live-announcement lab](AT-LIVE-LAB.md) for response/tool/request transitions, the [companion lab](AT-LAB.md) for Accessible View, or the [CLI lab](CLI-ACCESSIBILITY.md#manual-terminal-and-screen-reader-lab) for the one-shot terminal candidate. All use synthetic content and provide a copyable, consent-aware result record. A lab startup is not itself an AT result.

Keep host and client behavior within documented DSH extension seams. Do not patch generated CSS classes or inspect conversation text.

Do not use a DOM observer to rewrite host semantics, focus, or keyboard behavior. Any future access to conversation or workspace content requires a privacy review and an explicit boundary from the current read-only diagnostics.

Security reports use GitHub private vulnerability reporting. Conduct incidents follow the [`omdsh-dev/community` Code of Conduct](https://github.com/omdsh-dev/community/blob/main/CODE_OF_CONDUCT.md) and must not be filed publicly.
