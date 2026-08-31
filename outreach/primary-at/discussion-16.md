# DSH 0.1.2-alpha.2 human accessibility validation / 真人无障碍验证

The working group has prepared an exact, disposable campaign for real VoiceOver, Windows NVDA, and disabled-developer core-task results.

The authoritative campaign status is [PRIMARY-AT-CAMPAIGN.json](https://github.com/omdsh-dev/dsh-accessibility/blob/main/PRIMARY-AT-CAMPAIGN.json). Do not begin until it says `open`. When it is open, the launcher must report:

- DSH `0.1.2-alpha.2`: `5803bfcfdd502adac26ae9b8eec12d6aed263ec6`
- accessibility lab `0.1.0-beta.6`: `6aed71615edd1db1ec5b12897e1ad40b79294c78`
- scenario protocol: `dsh-core-at-lab/1.0.0-draft`

Start with the [English campaign guide](https://github.com/omdsh-dev/dsh-accessibility/blob/main/PRIMARY-AT-CAMPAIGN.md) or [中文活动指南](https://github.com/omdsh-dev/dsh-accessibility/blob/main/PRIMARY-AT-CAMPAIGN.zh.md). The first rows are VoiceOver with Safari on physical macOS, NVDA with isolated Chrome on physical Windows, and one disabled developer completing all representative core tasks in one exact environment. Partial and failed results are welcome.

For every task, record the actual outcome, independent/effective/safe completion, assistance, every directly observed AT modality, focus/cursor transition, workaround, and limitation. Do not infer speech from captions, DOM, accessibility trees, screenshots, automation, or an AI-operated session. Use only the disposable synthetic fixture and never publish the one-use sign-in URL, raw recordings, logs, prompts, credentials, personal paths, contact details, diagnosis, or disability details.

Submit real AT observations through the [AT result form](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=assistive-technology-test.yml) and disabled-developer outcomes through the [disabled-developer result form](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=disabled-developer-task-result.yml). A public Issue is source material only; a support claim requires a separate consented, de-identified, validated, and publicly reviewed ledger record.

The ledger starts with zero human records. Lab readiness, browser tests, and this discussion are not human evidence.

---

工作组已为真实 VoiceOver、Windows NVDA 和残障开发者核心任务结果准备了一套精确、一次性的验证活动。

权威活动状态见 [PRIMARY-AT-CAMPAIGN.json](https://github.com/omdsh-dev/dsh-accessibility/blob/main/PRIMARY-AT-CAMPAIGN.json)；只有状态变为 `open` 才开始。开放后，启动器必须报告上面的两个完整 revision 与 `dsh-core-at-lab/1.0.0-draft` 场景规程。

请从[中文活动指南](https://github.com/omdsh-dev/dsh-accessibility/blob/main/PRIMARY-AT-CAMPAIGN.zh.md)开始。首批目标是物理 macOS 的 VoiceOver／Safari、物理 Windows 的 NVDA／隔离 Chrome，以及一位残障开发者在单一精确环境中完成全部代表性核心任务。部分通过和失败结果同样有价值。

每项任务都要记录真实结果、是否独立／有效／安全完成、协助、每种真人直接观察到的辅助技术模态、焦点／光标转换、变通方式和限制。不得从字幕、DOM、无障碍树、截图、自动化或 AI 操作会话推断语音。只能使用一次性合成 fixture；绝不能公开一次性登录地址、原始录音、日志、提示词、凭据、私人路径、联系方式、诊断或残障详情。

真实辅助技术观察使用[辅助技术结果表单](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=assistive-technology-test-zh.yml)，残障开发者结果使用[残障开发者结果表单](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=disabled-developer-task-result-zh.yml)。公开 Issue 只是源材料；支持声明仍需另行生成经过同意、去标识化、验证和公开评审的账本记录。

活动开始时账本有零条真人记录。实验室就绪、浏览器测试和本 Discussion 都不是真人证据。
