# @oh-my-dsh/dsh-accessibility

[English](README.md) | 简体中文

这是 DeepSeek Harness 的可选无障碍 companion 插件：在设置中提供读屏操作说明和语义自检。当前源码还包含一个实验性的、受权限控制的静态 HTML 无障碍创作检查。它只使用 DSH 官方 slot，不修改或监听易变化的哈希 CSS 类名。

本仓库也是 [DSH 无障碍工作组](https://github.com/omdsh-dev/community/blob/main/working-groups/accessibility.zh-CN.md)的公开项目中心。项目使命是：让残障开发者能够独立、有效、安全地完成 DSH 的核心任务；让 DSH 帮助所有开发者产出更无障碍的数字内容；并用版本化标准、真实辅助技术和残障用户证据持续验证。

项目入口：[无障碍声明](ACCESSIBILITY_STATEMENT.zh.md) · [路线图](ROADMAP.zh.md) · [治理](GOVERNANCE.zh.md) · [研究与证据规程](RESEARCH.zh.md) · [贡献指南](CONTRIBUTING.zh.md)

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

## 自检范围

页面自检现包含 17 项结构检查，覆盖地标、应用一级标题、控件名称、图片替代文本、列表归属、嵌套交互控件、ARIA 引用、输入框与消息日志、菜单、列表框、树、单选组、标签页、弹窗和可调分隔条。它理解核心补丁采用的单一 Tab 入口与 `aria-activedescendant` 模式，也不会把菜单中的静态分隔线误判为可调分隔条。

全部通过只表示当前已挂载 DOM 满足这些可重复验证的结构契约，是测试证据而不是“完全合规”认证。实际朗读、浏览器到无障碍 API 的映射、焦点时序和 Windows 读屏表现，仍需按照插件内的 VoiceOver、NVDA、JAWS 场景做人工验证。

辅助技术矩阵、人工回归规程和支持边界见 [ACCESSIBILITY.zh.md](ACCESSIBILITY.zh.md)。

## 实验性无障碍创作预览

尚未发布的源码分支可以增加 Host 侧 `a11y_check` 工具。它默认关闭；只有 profile 同时启用并配置一个或多个明确根目录时，模型才能看到该工具。默认模式每次读取前都会请求批准：

```yaml
# 用户层 cordis.patch.yml
- id: accessibility
  config:
    authoring:
      enabled: true
      access: approval
      allowedRoots:
        - ./examples/a11y-check
```

工具读取一份普通 UTF-8 HTML 文件，运行固定的离线 `html-validate@11.4.0` 配置，并返回 `1.0.0` 报告。它不能写文件、上传内容、使用项目提供的规则，也不能认证无障碍。模型解释和修复建议与检测分开；批准后的修改仍使用 DSH 常规 edit/write 工具。完整的[权限、威胁、结果与扩展 RFC](RFC-A11Y-CHECK.zh.md)和[合成样例流程](examples/a11y-check/README.zh.md)可供审阅。

## 检查

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --pack-destination ./artifacts
```

## 模型体验

默认配置下，本包不会增加模型可见的工具、提示词、消息或上下文。只有管理员用非空根目录显式启用创作功能时，才会增加 `a11y_check`；其规范结果会明确写出：已运行自动检查，但尚未运行辅助技术和残障用户验证。

## 安全与隐私

浏览器自检只在内存中读取当前页面的语义属性，不读取对话文本、不发起网络请求，也不持久化结果。可选 Host 创作检查只读取配置根目录内的规范化路径，默认逐次请求批准，执行字节上限，不联网、不修改文件，也不持久化结果。
