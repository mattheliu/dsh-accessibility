# Contributing

Contributions that improve screen-reader interoperability, keyboard operation, diagnostics, documentation, or test evidence are welcome.

## Local checks

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
npm pack --dry-run
```

Behavior changes must include deterministic tests. Changes to support claims must update both accessibility documents and identify the exact browser, assistive-technology version, language, scenario, spoken result, and focus result. Automated checks do not count as manual screen-reader certification.

Keep host and client behavior within documented DSH extension seams. Do not patch generated CSS classes or inspect conversation text.
