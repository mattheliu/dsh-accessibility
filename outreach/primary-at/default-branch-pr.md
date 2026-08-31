## Outcome

Publish the current DSH accessibility program foundation to the default branch so community validation can use versioned protocols, disposable labs, privacy-minimized Issue forms, and fail-closed human-evidence review.

This PR does not add a human result or accessibility support claim. The primary campaign remains `prepared-not-open` until its public revisions, default-branch forms, Discussion 16, and Issues 1/2 are verified and the manifest is changed in a later reviewed commit.

## Exact first-wave candidate

- DSH `0.1.2-alpha.2`: `5803bfcfdd502adac26ae9b8eec12d6aed263ec6`
- lab implementation used by the campaign: `6aed71615edd1db1ec5b12897e1ad40b79294c78`
- core scenario protocol: `dsh-core-at-lab/1.0.0-draft`
- campaign protocol: `dsh-a11y-primary-at-campaign/0.1.0-draft`
- evidence catalog: `dsh-accessibility-core-tasks-2026-08-31-r2`

## Review focus

- The AT and disabled-developer Issue forms exist on the default branch and collect no identity, diagnosis, contact, raw recording, or private workspace data.
- `a11y-at-tested` and `a11y-user-validated` remain separate, exact-scope claims; failures and partial results remain `claim: none`.
- Every support-claimed task must be independent/effective/safe; every declared AT modality needs direct per-task human observation; claimed Web tasks need focus evidence.
- Chrome/Chromium labs use temporary profiles on macOS, Windows, and Linux and remove them before deleting disposable product state.
- Campaign schema rejects `open` while any public availability gate is missing.
- Anonymous public-readiness verification checks the exact revisions, current default-branch intake, Discussion 16, and Issues 1/2 without a token; strict mode fails closed and never creates human evidence.
- Automated browser, Host, accessibility-tree, caption, and AI-operated results cannot become human evidence.

## Verified locally

- `pnpm test`: 214 tests passed.
- `pnpm run typecheck`: passed.
- `pnpm run evidence:validate`: catalog, coverage policy, and non-evidence template passed.
- `pnpm run evidence:coverage`: zero human records and all 26 aggregate requirements missing, as expected.
- `pnpm pack --pack-destination ./artifacts`: campaign manifest, schema, bilingual guides, protocols, labs, and evidence tooling are present.
- Exact DSH/lab isolated-Chrome smoke: passed startup, temporary-profile use, and cleanup; this is lab readiness only.
- Exact DSH `5803bfcfdd` browser evidence: independently regenerated, copied byte-for-byte into the archived report, schema-valid, and passing fourteen checks in Chromium, Firefox, and WebKit; this remains non-AT and non-user evidence.

## After merge

- [ ] Verify both language variants of the AT and disabled-developer forms from the public Issue chooser.
- [ ] Update Discussion 16 and Issues 1/2 from the tested outreach bodies.
- [ ] Clone both exact revisions from a fresh directory and rerun the non-AT smoke.
- [ ] Verify all campaign links without organization membership.
- [ ] Change campaign status to `open` only after all five availability gates are `ready`.
- [ ] Keep the ledger at zero human records until a consented human result is actually reviewed.
