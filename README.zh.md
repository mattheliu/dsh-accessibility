# @oh-my-dsh/dsh-accessibility

[English](README.md) | 简体中文

这是 DeepSeek Harness 的可选无障碍 companion 插件：在设置中提供读屏操作说明和语义自检。它只使用 DSH 官方 slot，不修改或监听易变化的哈希 CSS 类名。

## 兼容性

`0.1.0-beta.4` 面向 `@deepseek-ai/dsh@0.1.1-rc.2` 及 [上游 Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546) 跟踪的无障碍核心补丁。插件能报告核心语义缺失，但无法从外部可靠替代组件本身的焦点陷阱、复合控件键盘操作、页面地标或 live region 策略。

## 从 npm 安装

```sh
dsh plugin --profile web add @oh-my-dsh/dsh-accessibility@0.1.0-beta.4
dsh --profile web
```

npm companion 不会修改 DSH 自有组件。在改动进入官方 DSH 发行版之前，请使用组织固定的 [DSH 无障碍构建](https://github.com/omdsh-dev/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2-a11y.3)，以获得完整键盘与读屏行为：

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
cd deepseek-harness
git checkout dsh-v0.1.1-rc.2-a11y.3
pnpm install
pnpm run build:official
pnpm dsh plugin --profile web add @oh-my-dsh/dsh-accessibility@0.1.0-beta.4
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

页面自检现包含 14 项结构检查，覆盖地标、控件名称、图片替代文本、ARIA 引用、输入框与消息日志、菜单、列表框、树、单选组、标签页、弹窗和可调分隔条。它理解核心补丁采用的单一 Tab 入口与 `aria-activedescendant` 模式，也不会把菜单中的静态分隔线误判为可调分隔条。

全部通过只表示当前已挂载 DOM 满足这些可重复验证的结构契约，是测试证据而不是“完全合规”认证。实际朗读、浏览器到无障碍 API 的映射、焦点时序和 Windows 读屏表现，仍需按照插件内的 VoiceOver、NVDA、JAWS 场景做人工验证。

辅助技术矩阵、人工回归规程和支持边界见 [ACCESSIBILITY.zh.md](ACCESSIBILITY.zh.md)。

## 检查

```sh
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack --pack-destination ./artifacts
```

## 模型体验

本包不会增加模型可见的工具、提示词、消息或上下文，只改变本地 Web UI 的设置界面。

## 安全与隐私

自检只在内存中读取当前页面的语义属性，不读取对话文本、不发起网络请求，也不持久化结果。
