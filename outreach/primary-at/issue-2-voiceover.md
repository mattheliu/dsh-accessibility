## Exact campaign target

Validate the DSH core Web tasks with a person directly operating and listening to VoiceOver on physical macOS.

Do not begin until the [campaign manifest](https://github.com/omdsh-dev/dsh-accessibility/blob/main/PRIMARY-AT-CAMPAIGN.json) says `open`. The launcher must report:

- DSH `0.1.2-alpha.2`: `5803bfcfdd502adac26ae9b8eec12d6aed263ec6`
- accessibility lab `0.1.0-beta.6`: `6aed71615edd1db1ec5b12897e1ad40b79294c78`
- protocol: `dsh-core-at-lab/1.0.0-draft`

The previous candidate text in this Issue is superseded. Historical comments remain valid only for the versions they name.

## Primary environment

- physical macOS with exact OS build;
- exact VoiceOver and Safari versions;
- one UI/speech language, voice, verbosity, punctuation, Quick Nav, input, and output configuration per result;
- a dedicated clean Safari profile. Stop immediately if Safari exposes personal tabs, history, bookmarks, accounts, extensions, or autofill.

```sh
pnpm --dir dsh-accessibility run lab:at:core ../deepseek-harness safari
```

Use [AT-CORE-LAB.md](https://github.com/omdsh-dev/dsh-accessibility/blob/main/AT-CORE-LAB.md). Record these nine claim-eligible task IDs without renaming them:

- `discover-structure`
- `navigate-sessions`
- `search-sessions`
- `adjust-layout`
- `switch-session-view`
- `read-conversation`
- `inspect-trajectory`
- `configure-settings`
- `edit-composer-draft`

## Required observation

For every task, retain pass, partial, or fail; independent/effective/safe completion; actual VoiceOver speech and keyboard observations; rotor or Quick Nav behavior when used; focus and VoiceOver cursor before and after important transitions; assistance; workaround; and the smallest reproducible barrier. A modality may be claimed only when directly observed on every claimed task. Do not infer output from captions, DOM, accessibility trees, automation, screenshots, or AI operation.

Use only the disposable synthetic Sessions. Never publish the one-use sign-in URL, raw speech history, recordings, logs, prompts, credentials, personal paths, or participant data.

## Acceptance boundary

- Partial and failed results remain `claim: none` and are not rerun or rewritten to hide a barrier.
- A candidate `a11y-at-tested` record must pass the public human-evidence validator and public review for this exact cohort.
- This Issue does not establish macOS, VoiceOver, or whole-product support by itself.
- Disabled-developer task completion is collected separately and is never inferred from an AT-specialist result.
