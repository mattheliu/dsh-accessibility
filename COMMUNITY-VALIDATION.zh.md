# 社区无障碍验证

简体中文 | [English](COMMUNITY-VALIDATION.md)

状态：公开参与指南。本指南本身不产生真人证据或支持声明。

DSH 需要两类不同的真人结果：真实辅助技术的互操作观察，以及残障开发者的任务结果。同一人可以贡献两类结果，但它们回答的问题不同，绝不能被悄悄合并。

## 选择一种入口

| 可以贡献的内容 | 公开入口 | 经过评审后可能形成什么 |
| --- | --- | --- |
| 可复现的产品障碍 | [无障碍障碍表单](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=accessibility-barrier-zh.yml) | 缺陷及回归测试；单独不能成为真人支持证据 |
| 实际语音、盲文、焦点、开关控制、语音输入、放大或其他辅助技术行为 | [辅助技术结果表单](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=assistive-technology-test-zh.yml) | 只有完成编码、验证和公开评审后，才可能形成限定范围的 `a11y-at-tested` 记录 |
| 残障开发者独立、有效、安全地完成任务的结果；可以使用或不使用专门辅助技术 | [残障开发者任务结果表单](https://github.com/omdsh-dev/dsh-accessibility/issues/new?template=disabled-developer-task-result-zh.yml) | 只有完成同意、编码、验证和公开评审后，才可能形成限定范围的 `a11y-user-validated` 记录 |

部分结果和失败结果同样有价值，必须保留真实结果，不能改写成笼统通过。启动日志、DOM 测试、无障碍树转储、截图、字幕面板、自动浏览器或 AI 操作的 VoiceOver 会话都不是真人辅助技术或残障用户结果。

## 选择版本化任务规程

每次只使用一个精确候选版本和一套规程：

- [核心 Web AT 实验室](AT-CORE-LAB.zh.md)：导航、Session、布局、对话、trajectory、设置和 composer 任务。
- [实时播报 AT 实验室](AT-LIVE-LAB.zh.md)：完成、停止、失败、问题、计划和审批状态转换。
- [Companion AT 实验室](AT-LAB.zh.md)：Accessible View，以及合成诊断建议、焦点检查和脱敏报告任务。
- [CLI 无障碍规程](CLI-ACCESSIBILITY.zh.md)：终端完成与鉴权失败任务。
- [无障碍创作 AT 实验室](AUTHORING-AT-LAB.zh.md)：仅允许一次与拒绝安全任务。

稳定任务清单和代表性核心分类只来自 [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json)。不得在结果中改名任务 ID 或自行把新任务声明为核心任务。

## 安全配置

1. 使用启动器打印的精确构建与完整 revision，不测试 `latest` 或未记录的工作树。
2. 只使用匹配实验室提供的一次性 DSH home、合成内容、loopback origin 和临时工作区。
3. macOS 优先使用实验室的 `chrome` 模式：它会创建并删除隔离 profile，并阻断非 loopback 名称解析。Safari 或 `system` 必须使用专门的干净浏览器 profile。若出现个人标签页、历史、书签、账户、扩展、自动填充、提示词、对话、凭据或路径，应在测试前立即停止。
4. 绝不公开一次性登录 URL，不通过隧道暴露 loopback server，也不替换成真实工作区。
5. 记录操作系统／build、浏览器或终端／shell 版本、实际使用的每种辅助技术及版本、locale、输入／输出方式、相关设置、精确 DSH／组件 revision 和所有协助。
6. 回到启动器请求清理。若中断后仍有状态，只检查终端打印的精确 lab 目录，并移到废纸篓；绝不能删除宽泛临时目录或 home。

## 观察任务，不要填写“预期答案”

每个稳定任务 ID 都要记录：

- 通过、部分或失败，以及任务是否完成；
- 是否独立、有效、安全地完成；
- 只有真人确实观察到时才记录真实语音或盲文，并记录重要转换前后的焦点／光标；
- 测试者理解到的控件角色、名称、状态、审批后果、错误和恢复路径；
- 与账本一致的协助等级（`none`、`setup-only`、`verbal`、`sighted-operation` 或 `other`）、变通方式及最小可复现障碍；
- 未测试内容和所有不能推广本结果的原因。

不要把异常语音“修正”为预期措辞。不得从字幕、DOM、平台无障碍 API、终端事件或 AI agent 的交互推断语音输出。

## 残障开发者参与

残障开发者结果只记录参与者为本任务自愿选择的类别。不得索取或公开身份、诊断、残障详情、雇主、联系方式或医疗历史。专门辅助技术不是必填项；没有使用时不得虚构。

参与完全自愿，任何时候都可以停止。研究负责人必须提供参与者能使用的说明、私密撤回渠道，并为时间和残障相关参与成本提供公平补偿。一位参与者绝不代表某个残障群体。要满足一项聚合残障开发者要求，同一位参与者必须在一条记录中完成该规程的全部代表性核心任务；项目绝不会把匿名记录拼接成仿佛来自同一个人。

私密撤回或参与者数据请求请使用仓库的[私密安全与隐私渠道](https://github.com/omdsh-dev/dsh-accessibility/security/advisories/new)。不得把联系方式或原始同意材料写进公开 Issue。

## 评审生命周期

1. 测试者或获授权的研究负责人提交最小化的去标识公开结果。
2. 维护者保留失败结果，并使用 `pnpm run evidence:scaffold` 创建由目录控制、`claim: none` 的 `dsh-a11y-human-evidence/0.1.0-draft` 模板。命令只接受规程／任务选择器，不接受 Issue 或参与者正文。
3. 评审核对同意、隐私、精确版本、稳定任务 ID、观察、焦点、协助、有效性、安全、障碍和限制。
4. 仓库验证器检查记录；它绝不会制造证据或自动升级结果。
5. 只有所有声明门禁通过并链接公开评审 Issue 后，才能提出严格限定范围的声明。
6. `pnpm run evidence:coverage` 在不混合不兼容 cohort 的前提下报告精确环境缺口。相关产品或环境变化会使记录过期，需要重新测试。

当前账本有零条真人记录，因此 26 项草案聚合要求全部缺失。这是在邀请社区贡献证据，并不表示候选版本“有障碍”或“无障碍”。

规范性的隐私、记录和聚合规则见 [RESEARCH.zh.md](RESEARCH.zh.md)、[HUMAN-EVIDENCE.zh.md](HUMAN-EVIDENCE.zh.md)与 [EVIDENCE-COVERAGE.zh.md](EVIDENCE-COVERAGE.zh.md)。
