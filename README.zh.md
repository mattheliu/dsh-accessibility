# @oh-my-dsh/dsh-accessibility

[English](README.md) | 简体中文

这是 DeepSeek Harness 的可选无障碍 companion 插件：提供读屏操作说明、语义自检和实验性的用户主动加载会话阅读视图。它只使用 DSH 官方 slot 与结构化 projection，不修改或监听易变化的哈希 CSS 类名。

本仓库也是 [DSH 无障碍工作组](https://github.com/omdsh-dev/community/blob/main/working-groups/accessibility.zh-CN.md)的公开项目中心。项目使命是：让残障开发者能够独立、有效、安全地完成 DSH 的核心任务；让 DSH 帮助所有开发者产出更无障碍的数字内容；并用版本化标准、真实辅助技术和残障用户证据持续验证。

项目入口：[无障碍声明](ACCESSIBILITY_STATEMENT.zh.md) · [路线图](ROADMAP.zh.md) · [治理](GOVERNANCE.zh.md) · [研究与证据规程](RESEARCH.zh.md) · [Accessible View RFC](RFC-ACCESSIBLE-VIEW.zh.md) · [浏览器证据 RFC](RFC-BROWSER-EVIDENCE.zh.md) · [创作／testkit RFC](RFC-A11Y-AUTHORING.zh.md) · [创作 agent 实验室](AUTHORING-AGENT-LAB.zh.md) · [创作辅助技术实验室](AUTHORING-AT-LAB.zh.md) · [CLI 无障碍规程](CLI-ACCESSIBILITY.zh.md) · [核心 AT 实验室](AT-CORE-LAB.zh.md) · [实时播报 AT 实验室](AT-LIVE-LAB.zh.md) · [Companion AT 实验室](AT-LAB.zh.md) · [贡献指南](CONTRIBUTING.zh.md)

## 兼容性

`0.1.0-beta.6` 仅面向 `@deepseek-ai/dsh@0.1.1-rc.2` 对应的客户端软件包版本线及 [上游 Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546) 跟踪的无障碍核心补丁。兼容性声明按版本收窄；DSH 发布新版本后，必须重新审查才能扩大 peer 范围。插件能报告核心语义缺失，但无法从外部可靠替代组件本身的焦点陷阱、复合控件键盘操作、页面地标或 live region 策略。

## 从 npm 安装

```sh
dsh plugin --profile web add @oh-my-dsh/dsh-accessibility@0.1.0-beta.6
dsh --profile web
```

npm companion 不会修改 DSH 自有组件。在改动进入官方 DSH 发行版之前，请使用组织固定的 [DSH 无障碍构建](https://github.com/omdsh-dev/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2-a11y.4)，以获得完整键盘与读屏行为：

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
cd deepseek-harness
git checkout dsh-v0.1.1-rc.2-a11y.4
pnpm install
pnpm run build:official
pnpm dsh plugin --profile web add @oh-my-dsh/dsh-accessibility@0.1.0-beta.6
pnpm dsh web
```

## 从本地 checkout 安装

```sh
pnpm install
pnpm run build
dsh plugin --profile web add file:.
dsh --profile web
```

打开“设置 → 无障碍”，即可检查当前页面并阅读 VoiceOver、NVDA 和 JAWS 操作速查。

## Accessible View 候选

当前开发分支还会通过 DSH 官方 `conversation.view` slot 注册实验性的“无障碍视图”。它尚未包含在已发布的 `0.1.0-beta.6` 中，也不构成稳定支持声明。

只选择标签页不会保留对话内容。激活“加载阅读视图”后，DSH 的结构化会话快照才进入组件。随后可以按来源顺序阅读最终和正在生成的记录，保留 Markdown 与代码语义；上下文、推理、工具参数／输出、命令输入和错误详情都要分别主动展开；还可以逐条复制消息和加载更早历史。“清除阅读视图并返回”会卸载内容，并把焦点还给“加载”。

MVP 仍以阅读为主。发送、停止、批准、编辑排队任务或使用专用工具控件时需返回 Chat。数据流、威胁评审、精确限制及 VoiceOver／NVDA 验证方式见 [RFC-ACCESSIBLE-VIEW.zh.md](RFC-ACCESSIBLE-VIEW.zh.md)。

开发期组装门禁还会在 Chromium、Firefox 和 WebKit 中以 640／320 CSS px 运行候选，采样焦点控件是否被遮挡、审计减少动态效果，并检查 Chromium 强制颜色参与情况。这些是版本化确定性结果，不是真实缩放、Windows 高对比度、辅助技术或残障用户证据。详见 [RFC-BROWSER-EVIDENCE.zh.md](RFC-BROWSER-EVIDENCE.zh.md)。

## 自检范围

页面自检现包含 17 项结构检查，覆盖地标、应用一级标题、控件名称、图片替代文本、列表归属、嵌套交互控件、ARIA 引用、输入框与消息日志、菜单、列表框、树、单选组、标签页、弹窗和可调分隔条。它理解核心补丁采用的单一 Tab 入口与 `aria-activedescendant` 模式，也不会把菜单中的静态分隔线误判为可调分隔条。

全部通过只表示当前已挂载 DOM 满足这些可重复验证的结构契约，是测试证据而不是“完全合规”认证。实际朗读、浏览器到无障碍 API 的映射、焦点时序和 Windows 读屏表现，仍需按照插件内的 VoiceOver、NVDA、JAWS 场景做人工验证。

辅助技术矩阵、人工回归规程和支持边界见 [ACCESSIBILITY.zh.md](ACCESSIBILITY.zh.md)。

## CLI 无障碍候选

`0.1.2-alpha.2` 开发线增加了显式低噪声 headless 展示与版本化最终 JSON 结果。本仓库负责 draft `dsh-cli-accessibility/1.0.0-draft` 符合性规程，以及一次性自动与人工启动器。自动进程输出不属于读屏证据；人工启动器仍须补充人类实际观察的语音或盲文记录。详见 [CLI-ACCESSIBILITY.zh.md](CLI-ACCESSIBILITY.zh.md)。

## 无障碍创作候选

Draft [创作／testkit RFC](RFC-A11Y-AUTHORING.zh.md) 把纯版本化证据引擎、仅用于开发的浏览器 testkit、两个独立评审的页面提供层、选择性启用且模型可见的 `a11y_check` 适配器，以及产品组合分成独立边界。五个独立本地包现已覆盖两条提供链路，并增加首个可安装的 `dsh-a11y-local-preview/0.1.0-draft` DSH bundle。该 bundle 通过已发布 DSH 插件生命周期挂载字面量 loopback 提供层与只读工具，只向模型公布规范化不透明目标句柄，在挂载前拒绝可能承载秘密的 query／fragment，并且在宿主提供可丢弃 loopback 目标前保持禁用。真实 Chromium、真实 loopback HTTP、已发布 DSH `SystemPrompt`／`ToolRuntime`、bundle 安装、配置 dump、生命周期释放、隐私和包内容测试均已在本地通过。版本化[创作 agent 实验室](AUTHORING-AGENT-LAB.zh.md)证明了一项无密钥真实产品 agent-loop 任务：工具轨迹精确为 `a11y_check → read → edit → a11y_check`，自动 finding 从两项降到零。另行提供的[创作辅助技术实验室](AUTHORING-AT-LAB.zh.md)现可通过真实 DSH Web 与审批 UI 操作该流程，并加入“仅允许一次”和“拒绝后源码不变”的自动安全门禁，以及经同意的 VoiceOver／NVDA 真人记录格式；自动浏览器和 Host 结果仍明确不属于辅助技术证据。五个包继续保持 private、尚未发布；评审、live-model 修复、人工听读辅助技术和残障作者门禁仍待完成，自动报告干净永远不能表述成 WCAG 符合。

## 检查

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --pack-destination ./artifacts
```

## 模型体验

本分支的 runtime companion 不会增加模型可见的工具、提示词、消息或 context。另行授权的私有创作包不会被捆绑进 companion。

## 安全与隐私

自检只在内存中读取当前页面语义属性，绝不读取对话文本。Accessible View 只有在用户主动加载后才读取当前结构化对话；敏感技术部分还需分别展开，复制则是逐条消息写入系统剪贴板的显式操作。两项功能都不发起网络请求、不发送遥测，也不自行持久化结果或对话副本。
