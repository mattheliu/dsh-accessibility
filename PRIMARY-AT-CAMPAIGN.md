# Primary VoiceOver, NVDA, and disabled-developer campaign

[简体中文](PRIMARY-AT-CAMPAIGN.zh.md) | English

Campaign status: `prepared-not-open`; external testing is not open. Campaign protocol: `dsh-a11y-primary-at-campaign/0.1.0-draft`. Scenario protocol: `dsh-core-at-lab/1.0.0-draft`. Machine-readable state: [PRIMARY-AT-CAMPAIGN.json](PRIMARY-AT-CAMPAIGN.json).

This first campaign targets exact DSH `0.1.2-alpha.2` revision `5803bfcfdd502adac26ae9b8eec12d6aed263ec6` with exact lab revision `6aed71615edd1db1ec5b12897e1ad40b79294c78`. An isolated-Chrome startup and cleanup smoke run passed for this pair on macOS. That proves only lab readiness; the ledger still contains zero human records.

## Why recruitment is not open yet

The public core branch and lab branch do not yet contain the two pinned revisions. The default branch does not contain this guide or the AT and disabled-developer Issue forms. [Discussion 16](https://github.com/omdsh-dev/dsh-accessibility/discussions/16), [NVDA Issue 1](https://github.com/omdsh-dev/dsh-accessibility/issues/1), and [VoiceOver Issue 2](https://github.com/omdsh-dev/dsh-accessibility/issues/2) still name the superseded `0.1.1-rc.2` candidate. Inviting people now would give them stale instructions or a missing intake route.

The campaign may change to `open` only after every `availabilityGates` row in the manifest is `ready`. Opening the campaign is coordination state, not accessibility evidence.

Maintainer publication order and tested replacement bodies for the default-branch PR, Discussion 16, and Issues 1/2 are in the [primary AT outreach handoff](outreach/primary-at/README.md).

## Exact setup after the campaign opens

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
git -C deepseek-harness checkout 5803bfcfdd502adac26ae9b8eec12d6aed263ec6
pnpm --dir deepseek-harness install --frozen-lockfile
pnpm --dir deepseek-harness run build

git clone https://github.com/omdsh-dev/dsh-accessibility.git
git -C dsh-accessibility checkout 6aed71615edd1db1ec5b12897e1ad40b79294c78
pnpm --dir dsh-accessibility install --frozen-lockfile
```

For VoiceOver with Safari on a dedicated clean profile:

```sh
pnpm --dir dsh-accessibility run lab:at:core ../deepseek-harness safari
```

For NVDA with Chrome on physical Windows, use the cross-platform isolated profile:

```sh
pnpm --dir dsh-accessibility run lab:at:core ../deepseek-harness chrome
```

The launcher must report the two exact revisions above. Stop if either checkout is dirty, a different revision appears, personal browser UI appears, or the disposable fixture is not the only content. Follow [AT-CORE-LAB.md](AT-CORE-LAB.md), then submit one environment/language combination through the AT form. A disabled developer uses the same exact lab and the dedicated disabled-developer form; dedicated AT is recorded only when actually used.

## First-wave acceptance

- VoiceOver/Safari: all nine claim-eligible core tasks have direct human observations for every declared modality and at least one focus transition per Web task.
- NVDA/Chrome: the same exact task set on physical Windows, including browse/focus-mode behavior.
- Disabled-developer core: one participant completes all seven representative-core tasks independently, effectively, and safely in one exact-environment record.
- Failed and partial outcomes remain public barriers with `claim: none`; no result is normalized into a pass.
- Every candidate claim passes `pnpm run evidence:validate` and public review. Coverage remains scoped and is never called “fully accessible” or certification.

See [COMMUNITY-VALIDATION.md](COMMUNITY-VALIDATION.md) for consent, privacy, compensation, withdrawal, observation, and review rules.
