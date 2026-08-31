# Authoring alpha release preflight

Protocol: `dsh-a11y-authoring-alpha-preflight/0.1.0-draft`. Machine-readable contract: [AUTHORING-ALPHA-PREFLIGHT.schema.json](AUTHORING-ALPHA-PREFLIGHT.schema.json).

This preflight turns the six-package policy into a dependency-first publication plan and checks the exact state needed by a local alpha publisher. It is intentionally non-mutating: it performs read-only GitHub, Git-remote, and npm registry lookups, packs each clean exact checkout into a disposable directory, emits one bounded JSON report, and removes the tarballs.

Run the diagnostic report even while blockers remain:

```sh
pnpm run authoring:alpha:report
```

Use the fail-closed gate immediately before a release:

```sh
pnpm run authoring:alpha:preflight
```

The gate requires:

- the exact repository metadata, public visibility, `main` branch, clean local revision, matching origin identity, and the same revision on the remote branch;
- an authenticated local npm publisher;
- every exact version to remain absent from the public registry;
- public package access and the `alpha` dist-tag, never `latest`;
- successful disposable packing of all six sources; and
- the dependency order `testkit → authoring → providers → compositions`, with independent packages grouped into the same layer.

The preflight never creates or changes a GitHub repository, pushes, tags, publishes, reserves a package name, or changes npm distribution tags. A passing result is only a point-in-time release prerequisite. It is not accessibility conformance, real assistive-technology evidence, or disabled-user validation.

