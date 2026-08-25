# dsh-accessibility

[English](README.md) | 简体中文

这是 DeepSeek Harness 的可选无障碍 companion 插件：在设置中提供读屏操作说明和语义自检。它只使用 DSH 官方 slot，不修改或监听易变化的哈希 CSS 类名。

## 兼容性

`0.1.0-beta.1` 面向 `@deepseek-ai/dsh@0.1.1-rc.2` 及 [上游 Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546) 跟踪的无障碍核心补丁。插件能报告核心语义缺失，但无法从外部可靠替代组件本身的焦点陷阱、树形键盘操作、页面地标或 live region 策略。

## 从本地 checkout 安装

```sh
pnpm install
pnpm run build
dsh plugin --profile web add file:.
dsh --profile web
```

打开“设置 → 无障碍”，即可检查当前页面并阅读 VoiceOver、NVDA 和 JAWS 操作速查。

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
