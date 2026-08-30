# 无障碍声明

简体中文 | [English](ACCESSIBILITY_STATEMENT.md)

最后复审：2026-08-30。

DSH 无障碍工作组的目标是让残障开发者能够独立、有效、安全地完成 DSH 的核心任务，并让 DSH 帮助所有开发者产出更无障碍的数字内容。

## 范围与目标

本声明覆盖 `@oh-my-dsh/dsh-accessibility` companion，以及 [ACCESSIBILITY.zh.md](ACCESSIBILITY.zh.md) 标明的组织维护 DSH 无障碍候选。Web 目标为 WCAG 2.2 AA，并使用 WAI-ARIA Authoring Practices 约束交互模式。由于 DSH 也是创作型智能体，项目使用 ATAG 2.0 Part A 与 Part B 作为产品设计指导。这些目标不构成合规声明。

## 当前支持

- companion 提供读屏操作指南，以及针对已挂载 HTML 与 ARIA 结构的 17 项确定性检查。
- rc.2 无障碍候选包含地标、具名弹窗、焦点约束与返回、复合控件键盘模式、对话／日志语义、状态播报和键盘可调分隔条。
- 版本化候选具备生产浏览器、组件、构建和跨平台自动化证据。
- 已在启用 VoiceOver 的 macOS Safari 和 Chrome 中检查辅助功能树和键盘路径。
- alpha.1 部分核心候选已经为其已实现项取得绿色组件、组装浏览器和跨浏览器确定性证据；待处理项公开记录在[核心兼容性台账](CORE-COMPATIBILITY.zh.md)中。

## 已知限制

- VoiceOver 经人工听读的完整实际朗读记录仍待补。
- Windows 实机 NVDA、JAWS、Narrator，以及 Linux Orca 结果仍待补。
- 当前 companion 不能修复缺失的核心焦点、键盘或播报行为，也不能直接观察操作系统无障碍 API 或精确读屏语音。
- 完整补丁范围的维护候选仍基于 DSH `0.1.1-rc.2`。alpha.1 核心候选只是部分候选；兼容性台账中的待处理行全部解决前，不能替代既有构建，也不能扩大 companion peer 范围。
- 强制颜色、200%/400% 重排、盲文显示器、语音识别、开关控制，以及更广泛的认知和低视力场景尚未完成。
- 自动检查通过不代表所有残障人士都能使用每一个工作流。

精确支持矩阵和人工场景维护在 [ACCESSIBILITY.zh.md](ACCESSIBILITY.zh.md)，后续路线和发布门禁见 [ROADMAP.zh.md](ROADMAP.zh.md)。

## 反馈

请使用仓库的“无障碍障碍报告”表单反馈问题，注明精确版本并提供脱敏任务描述；不得包含凭据、私人提示词、对话内容、用户名或敏感路径。辅助技术用户可通过辅助技术测试表单提交结构化结果。

安全或隐私问题使用私有漏洞报告。行为事件遵循 [`omdsh-dev/community` 行为准则](https://github.com/omdsh-dev/community/blob/main/CODE_OF_CONDUCT.zh-CN.md)，不得公开报告。
