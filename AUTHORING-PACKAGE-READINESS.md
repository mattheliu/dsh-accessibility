# Authoring package readiness

The six accessibility-authoring components are separate capability and review boundaries. `AUTHORING-PACKAGES.json` pins their package names, exact prerelease versions, roles, internal dependency graph, exact `omdsh-dev` repository metadata, and the non-`latest` `alpha` distribution tag. Run:

```sh
pnpm run authoring:readiness
```

The default command emits a machine-readable report without hiding blockers. `pnpm run authoring:readiness:require` exits non-zero until every checkout has a clean exact Git revision, an origin matching the policy repository identity, exact npm metadata and safety documentation, public access with the `alpha` dist-tag, and only exact registry-compatible internal dependencies.

The report deliberately does not run tests and is not an accessibility claim. Before publishing, also run every package's typecheck, test, coverage, build, pack-content, isolated tarball-install, and real-DSH authoring gates. Real assistive-technology and disabled-author evidence remain separate requirements in `EVIDENCE-COVERAGE.md`.

After the source checkouts are clean and every internal dependency uses the exact version pinned by the policy, run `pnpm run authoring:install`. It freshly packs all six checkouts, installs both top-level compositions into a disposable consumer with only tarball overrides, and imports every package. This proves that published manifests no longer depend on the sibling source layout; it does not claim that the packages exist on npm.
