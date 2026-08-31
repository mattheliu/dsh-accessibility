# Authoring package readiness

The six accessibility-authoring components are separate capability and review boundaries. `AUTHORING-PACKAGES.json` pins their package names, exact prerelease versions, roles, and internal dependency graph. Run:

```sh
pnpm run authoring:readiness
```

The default command emits a machine-readable report without hiding blockers. `pnpm run authoring:readiness:require` exits non-zero until every checkout has a clean exact Git revision, an origin remote, complete npm metadata and safety documentation, a public publication configuration, and only exact registry-compatible internal dependencies.

The report deliberately does not run tests and is not an accessibility claim. Before publishing, also run every package's typecheck, test, coverage, build, pack-content, isolated tarball-install, and real-DSH authoring gates. Real assistive-technology and disabled-author evidence remain separate requirements in `EVIDENCE-COVERAGE.md`.
