# 真人证据覆盖策略

简体中文 | [English](EVIDENCE-COVERAGE.md)

策略规程：`dsh-a11y-evidence-coverage-policy/0.1.0-draft`。报告规程：`dsh-a11y-evidence-coverage-report/0.1.0-draft`。

机器可读契约：[EVIDENCE-COVERAGE-POLICY.json](EVIDENCE-COVERAGE-POLICY.json)、[策略 Schema](EVIDENCE-COVERAGE-POLICY.schema.json)及[报告 Schema](EVIDENCE-COVERAGE-REPORT.schema.json)。

单条记录 validator 只能回答一份公开真人结果自身是否有效、是否能支撑其收窄声明。它不能回答项目是否覆盖全部必需任务，也不能阻止评审者误把不同 DSH、浏览器、终端、辅助技术、locale 或设置版本的结果拼成整体结论。本策略补上这个聚合边界。

## Draft 真人证据基线

基线包含六个 profile、二十六项要求：

| Profile | 必须具备的真人覆盖 |
| --- | --- |
| 核心 Web 与实时状态 | 使用 VoiceOver／Safari 和 NVDA／Chrome 覆盖所有可声明的核心与实时状态任务。 |
| Accessible View | 使用 VoiceOver／Safari 和 NVDA／Chrome 覆盖所有可声明的 companion 任务。 |
| 一次性 CLI | 在 VoiceOver 与 NVDA 终端环境中覆盖所有可声明 CLI 任务。 |
| 无障碍创作 | 使用 VoiceOver／Safari 和 NVDA／Chrome 覆盖“仅允许一次”和拒绝安全任务。 |
| 扩展辅助技术矩阵 | 使用 JAWS／Chrome、Narrator／Edge、Orca／Firefox 覆盖核心 Web；使用盲文、语音输入、开关输入和放大覆盖核心 Web；另用 JAWS、Narrator、Orca 与盲文覆盖 CLI。只按模态限定的行仍要求每条证据写明辅助技术名称与精确版本。 |
| 残障开发者验证 | 每项规程都要有一条经过同意的残障开发者记录；该条记录须包含本规程所有代表性核心任务，并证明独立、有效、安全完成。 |

精确任务清单只来自 [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json)，覆盖策略不能重新归类任务。

## 聚合规则

AT 记录只能在同一精确环境 cohort 内合并。cohort 固定 DSH 及参与组件版本／revision、操作系统、浏览器或终端与 shell、辅助技术版本／模态、locale、输入方式和相关设置。VoiceOver 10 与 11、两个浏览器版本、两个 DSH revision 或不同设置的记录绝不能共同填满一行。

残障开发者覆盖更严格：一项规程的全部必需任务必须出现在同一条有效 `a11y-user-validated` 记录中。公开记录有意不保存参与者身份，因此 aggregator 绝不会把多条记录合并后暗示同一个人完成了所有任务。

生成报告只重复最小化隐私的 cohort 字段和公开 record ID，不复制观察内容、设置文本、参与者数据或原始材料。

## 运行报告

```sh
pnpm run evidence:coverage
```

命令始终校验证据目录、覆盖策略和发现的每条证据记录。缺失覆盖会以结构化 `missing` 行输出并正常退出，因此空账本的诚实状态不会让日常开发 CI 失败。

发布或证据评审流程可以显式要求完整 draft 基线：

```sh
pnpm run evidence:coverage:require
```

只要仍有要求缺失，该命令就非零退出。仓库目前没有真人记录，因此它尚未进入日常 CI。

## 声明边界

`baselineSatisfied: true` 只表示本 draft 策略在不跨越 cohort 边界的前提下找到了全部要求。报告始终携带 `verdictScope: coverage-policy-only-not-release-readiness`。它不能证明参与者多样性、当前目录以外的任务、未纳入的平台或模态，也不能证明没有尚未发现的障碍。它不是 WCAG／ATAG 符合声明、认证、普遍无障碍声明或发布批准。发布仍需精确目标 build 兼容性、确定性门禁、隐私评审、已知限制、维护者评审，以及 [ROADMAP.zh.md](ROADMAP.zh.md) 中的发布标准。

## 当前状态

仓库账本只有一份非证据模板，真人证据记录为零。因此二十六项要求全部为 `missing`；这是准确的项目缺口，不是 validator 失败。
