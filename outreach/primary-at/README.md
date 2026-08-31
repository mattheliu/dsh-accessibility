# Primary AT campaign publication handoff

This directory contains reviewed source text for the public availability gates in [PRIMARY-AT-CAMPAIGN.json](../../PRIMARY-AT-CAMPAIGN.json). It is coordination material, not assistive-technology or disabled-user evidence. Do not post any body from this directory while the campaign status is `prepared-not-open` unless the body itself tells readers to wait for the machine-readable status.

## Required order

Before the first external write, run the versioned read-only local/public preflight from the current handoff branch:

```sh
pnpm run campaign:publish:require -- ../deepseek-harness-alpha2
```

It must report `localReady: true`. The report records exact local revisions, matching target remotes, committed handoff files, anonymous public gate observations, and which action is currently ready; it never pushes, merges, edits a thread, opens recruitment, or creates human evidence.

1. Publish DSH revision `5803bfcfdd502adac26ae9b8eec12d6aed263ec6` on `omdsh-dev/deepseek-harness` without changing the revision.
2. Publish accessibility-lab revision `6aed71615edd1db1ec5b12897e1ad40b79294c78` and the campaign commit that contains this handoff on `omdsh-dev/dsh-accessibility`.
3. Review and merge the default-branch change using [default-branch-pr.md](default-branch-pr.md). GitHub Issue forms are not available from a feature branch; verify both AT and disabled-developer forms on the default branch after merge.
4. Replace Discussion 16 with [discussion-16.md](discussion-16.md), NVDA Issue 1 with [issue-1-nvda.md](issue-1-nvda.md), and VoiceOver Issue 2 with [issue-2-voiceover.md](issue-2-voiceover.md). Preserve existing public history; edit the bodies rather than closing and recreating the threads.
5. From a fresh directory, clone and check out both exact revisions using the commands in the campaign guide. Run the isolated Chrome smoke and verify cleanup. Do not turn on a screen reader for this availability check.
6. Verify that the English and Chinese issue-form URLs open the intended default-branch forms, the private withdrawal route works, and every public link is readable without organization membership. Run `pnpm run campaign:public:verify`; inspect every structured check instead of inferring availability from a signed-in browser.
7. Change all five `availabilityGates` rows to `ready` and change campaign status to `open` in one reviewed commit. The campaign schema intentionally rejects `open` while any gate is missing.
8. Run `pnpm run campaign:public:require`, then re-run `pnpm test`, `pnpm run typecheck`, `pnpm run evidence:validate`, and `pnpm run evidence:coverage`. Zero human records is the correct starting state.

Do not create an `a11y-at-tested` or `a11y-user-validated` record from this publication work. Only a later consented human run, de-identified review, and validated ledger record can support those claims.
