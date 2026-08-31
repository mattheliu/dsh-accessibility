# 真人无障碍证据规程

简体中文 | [English](HUMAN-EVIDENCE.md)

规程：`dsh-a11y-human-evidence/0.1.0-draft`。机器可读契约：[HUMAN-EVIDENCE.schema.json](HUMAN-EVIDENCE.schema.json)。权威任务分类：[EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json)，由 [EVIDENCE-CATALOG.schema.json](EVIDENCE-CATALOG.schema.json) 校验。

本规程把经过同意的辅助技术与残障开发者任务结果转成公开、版本化、最小化隐私的证据账本。它不收集原始研究数据，也绝不会把自动测试、无障碍树 dump、字幕面板、Host 事件、截图或启动日志提升为真人证据。

## 记录、结果与声明是三件事

每次有效真人运行都可以记录，包括失败和部分结果。只有满足更严格的支持声明门禁，`claim` 才能不是 `none`。

| 记录字段 | 含义 |
| --- | --- |
| `evidenceKind: assistive-technology-run` | 真人观察并操作了具名浏览器／终端与访问技术组合。 |
| `evidenceKind: disabled-user-task-run` | 残障开发者执行了任务；公开记录不要求披露残障或诊断细节。 |
| `claim: none` | 结果有价值，但不能支撑公开支持标签。模板、失败、部分结果、过期矩阵行和仍有高影响障碍时必须使用。 |
| `claim: a11y-at-tested` | 所有被声明任务在只有 setup 或无协助的情况下有效、安全通过；全部真人观察通过；焦点未丢失；同意、精确版本、当前评审和公开评审 Issue 齐全。 |
| `claim: a11y-user-validated` | 经过同意的残障开发者运行，并且至少一项由固定证据目录归类为代表性核心任务的任务，在没有操作协助的情况下独立、有效、安全完成。使用专门辅助技术时必须记录，但并非每种残障或任务都必须使用专门辅助技术。 |

证据等级描述真正观察到的内容；不能因为存在一个 JSON 文件就授予徽章。记录与声明冲突时，validator 会 fail closed。

## 必须精确限定的范围

一条记录只覆盖一个精确场景规程、任务集合、DSH revision、参与运行的组件 revision、操作系统、浏览器或终端、实际使用的访问技术、locale、设置和测试日期。`latest`、分支名、dirty 状态描述、占位 revision 或无边界兼容范围均无效。

记录包括：

- 精确产品／组件版本和完整 commit revision；
- 固定证据目录的规程与 ID，以及目录中精确的场景规程和任务 ID；
- 操作系统、浏览器或终端、实际使用的访问技术及模态、输入方式与相关设置；
- 不包含身份、诊断或残障细节的测试者类别；
- 发布去标识化摘要的明确授权；残障用户研究还要在私有侧保留撤回渠道；
- 每项任务的结果、独立性、有效性、安全性、协助、短语音／盲文／交互观察、焦点转换、障碍与限制；
- 总体结果和范围收窄的声明文本；
- 评审状态与 `validUntil`；
- 审查任何支持声明的公开 Issue 或 Discussion。

`scenario.taskIds` 必须与任务记录完全一致，并且每个任务都必须存在于固定证据目录对应规程下。记录不能自行把任务声明为核心任务或声明可用任务；新增或修改任务必须先经过目录评审。目录中标记为 `claimEligible: false` 的已知探索性任务只能使用 `claim: none` 记录。隐藏协助无效。存在 high／blocker 障碍、被声明 checkpoint 失败或未观察、焦点异常／丢失、任务不安全或无效、缺少公开评审，或证据已过期时，都不能做支持声明。

`assistive-technology-run` 必须列出至少一种实际使用的访问技术，且只能支持 `a11y-at-tested`。残障参与者没有使用专门辅助技术时，`disabled-user-task-run` 可以将 `accessTechnologies` 留空；不得虚构占位 AT。DSH-only 运行同样把 `builds.components` 留空，只列出实际参与的组件。

## 新鲜度与失效

当前记录最长只能保持 current 120 天。如果相关 DSH minor 线、自有 UI、场景、浏览器、终端、访问技术、语言行为或依赖发生可能影响结果的变化，则必须更早失效。

矩阵行过时时：

1. 在新精确环境中重新执行；或
2. 把 `claim` 改为 `none`，将 `review.status` 设为 `expired` 或 `superseded`，写明失效变化；在同意仍允许公开时保留历史结果。

若一条记录超过 `validUntil` 仍标为 `current`，CI 会故意失败。这是维护信号，不代表产品一定发生回归。

## 创建与验证记录

1. 从 [EVIDENCE-CATALOG.json](EVIDENCE-CATALOG.json) 选择精确规程和稳定任务 ID，再使用匹配的一次性实验室并遵循 [RESEARCH.zh.md](RESEARCH.zh.md)。
2. 提交匹配的辅助技术或残障开发者结果 Issue 表单；不要在 Issue 中放原始数据。
3. 生成由目录控制、私有权限的 scaffold。它拒绝未知规程／任务、保持目录顺序、不读取 Issue 正文，并始终输出 `recordType: template` 与 `claim: none`：

```sh
pnpm run evidence:scaffold -- \
  --protocol dsh-core-at-lab/1.0.0-draft \
  --tasks representative-core \
  --kind disabled-user-task-run \
  --locale zh-CN \
  --output human-evidence.template.json
```

适用时可把 `representative-core` 换成 `claim-eligible`、`safety-critical`、`all` 或逗号分隔的精确任务清单。输出必须是尚不存在的 `.json` 文件；工具绝不覆盖既有文件。仍可复制[创作示例模板](evidence/templates/authoring-at.allow-once.template.json)。
4. 评审去标识化 Issue 源材料，替换所有合成值，选择新的唯一 `recordId`，将 `recordType` 设为 `human-evidence`，并把已评审记录写入 `evidence/records/<year>/`。记录真实结果；除非每个声明条件都有证据，否则保持 `claim: none`。不得把原始 Issue 导出或私有研究材料粘贴进生成器或公开记录。
5. 声明支持时链接公开评审 Issue，并运行：

```sh
pnpm run evidence:validate
pnpm run evidence:coverage
```

仓库内 JSON Schema 供编辑器和外部工具使用。仓库 validator 还会检查固定目录身份、已登记规程／任务、由目录决定的核心与声明资格、跨字段任务清单、120 天新鲜度、占位符拒绝与隐私模式。随后，[聚合覆盖策略](EVIDENCE-COVERAGE.zh.md)会报告仍缺失的精确环境 cohort 和残障开发者代表性任务集合；它不会升级单条记录，也不能替代发布评审。

## 隐私与撤回

公开证据不得包含姓名、handle、邮箱、联系渠道、残障或诊断字段、用户名、凭据、一次性 URL、运行时 Session ID、私有绝对路径、原始转录、原始日志或录音链接。解释互操作性必需的短句只有在检查和同意后才允许；应优先保留简短观察，而不是连续语音历史。

validator 会在所有 key 与字符串中搜索常见凭据和私有数据模式，拒绝类似日志的超长值及未替换模板标记。自动隐私 lint 只是最后一道护栏；真人评审仍必须判断上下文和重新识别风险。

原始音视频、同意记录、联系信息、撤回渠道、残障信息和未脱敏笔记必须留在具备访问与删除控制的获准私有研究存储中。撤回同意时，按 [RESEARCH.zh.md](RESEARCH.zh.md) 删除可归因公开内容，并按需要标记或删除账本记录。绝不能为了满足公开布尔值而提交私有撤回渠道。

## 当前账本状态

仓库目前只有一个非证据模板。没有任何文件会自动成为 `a11y-at-tested` 或 `a11y-user-validated` 声明。因此聚合覆盖报告显示真人记录为零、二十六项要求缺失。支持状态仍以 [ACCESSIBILITY.zh.md](ACCESSIBILITY.zh.md) 的收窄矩阵为准；在经过同意的真人记录通过本规程与评审之前，对应矩阵行继续保持 pending。
