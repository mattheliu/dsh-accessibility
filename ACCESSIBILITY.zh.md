# 无障碍支持与验证

[English](ACCESSIBILITY.md)

本项目的目标是让仅使用键盘或读屏软件的用户可以操作并理解 DeepSeek Harness Web 的完整工作流。companion 自检只提供附加证据；语义、焦点、复合控件键盘模型和状态播报仍由 DSH 自有组件负责。

## 支持的核心版本

- 官方基线：`@deepseek-ai/dsh@0.1.1-rc.2`。
- 完整补丁构建：[`dsh-v0.1.1-rc.2-a11y.4`](https://github.com/omdsh-dev/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2-a11y.4)。
- 上游跟踪：[deepseek-ai/deepseek-harness Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546)。

把本 npm 包装入未打核心补丁的官方构建，只会增加诊断和操作指南，不能替代缺失的核心焦点或复合控件行为。

## 辅助技术矩阵

| 平台 | 浏览器 | 辅助技术 | 状态 |
| --- | --- | --- | --- |
| macOS | Chrome 151 | VoiceOver | 浏览器辅助功能树与键盘回归通过；完整实际朗读记录待补 |
| macOS | Safari 18.5 | VoiceOver 10 | 启用 VoiceOver 的原生树与焦点路径回归通过；经人工听读的完整朗读记录待补 |
| Windows 11 | Chrome／Firefox | NVDA | Windows 自动门禁通过；物理读屏回归待补 |
| Windows 11 | Edge／Chrome | JAWS | Windows 自动门禁通过；物理读屏回归待补 |
| Windows 11 | Edge | Narrator | 建议作为兼容信号，不能替代 NVDA 或 JAWS |

## 已记录的 macOS 证据

2026-08-26 的回归环境为 macOS 15.5（24F74）、Chrome 151.0.7922.170、Safari 18.5 与 VoiceOver 10。在补丁生产构建中，Safari 原生辅助功能树暴露了具名导航、唯一的应用一级标题、主区域与补充地标、对话日志与消息 article、Chat／Trajectory 标签组、时间线复合控件、菜单、弹窗、输入控件及可调分隔条。键盘检查覆盖标签切换、菜单关闭、弹窗内连续四十次 Tab 焦点约束、折叠搜索从辅助功能树移除及 Escape 焦点返回，以及折叠侧栏中的具名设置触发器。已安装 companion 的每项确定性自检均通过。

启用 VoiceOver 的 Safari 实测启动了真实系统 VoiceOver 进程，并操作中文引导与空外壳流程。顺序焦点依次经过“打开侧边栏”“新建会话”“添加工作区”“搜索会话”“设置”“选择工作区”“Agent 预设”和输入区。设置通过键盘打开，内部控件可达，按 Escape 后焦点返回“设置”。原生辅助功能树为每个经过的控件暴露了角色与本地化名称。

这些证据验证了真实启用 VoiceOver 的环境、浏览器映射、暴露结构和自动化界面可观察到的焦点／按键行为。运行器无法可靠捕获音频朗读或 VoiceOver 光标覆盖层，因此矩阵仍把经人工听读的实际语音列为待补，不把本次结果提升为辅助技术认证。

## 必做人工场景

1. 通过地标和标题浏览，不逐个经过所有控件。
2. 打开和关闭设置、原图预览与嵌套弹窗，确认焦点约束及返回。
3. 用一次 Tab 进入工作区树和子代理树，再使用方向键、Home、End、Enter 与空格。
4. 操作模型菜单、动作菜单、子菜单、前缀搜索、Escape 和 Tab 离开。
5. 操作命令组合框与列表框，确认 active-descendant 播报。
6. 完成单选、多选及自定义文本问题。
7. 阅读对话文章、推理、工具输出、代码、表格、公式、图片、错误及完成状态。
8. 用键盘调整两侧面板分隔条并确认数值播报。
9. 选择轨迹行和范围、切换视图，并用一次 Tab 离开复合控件。
10. 打开反馈备注、遍历边界、提交或取消，并确认焦点返回。
11. 覆盖离线、重连、加载、鉴权错误、中断和重试状态。
12. 在 200% 与 400% 缩放、减少动态效果及强制颜色模式下重复关键流程。

记录浏览器、辅助技术版本、语言、场景、实际朗读、焦点结果和通过／失败。自动 DOM 通过不得替代人工辅助技术通过。

## 自动门禁

- 设置页内 17 项确定性语义自检。
- 名称、引用、地标、标题、列表归属、嵌套控件、菜单、列表框、树、单选组、标签页、弹窗及分隔条单元测试。
- 插件设置界面的 axe-core 回归。
- GitHub Actions 中的跨平台 Node、类型、单元、构建和包内容检查。
- 补丁核心保留组件、GUI、生产构建及浏览器回放套件。

## 问题反馈

请在 [GitHub Issues](https://github.com/omdsh-dev/dsh-accessibility/issues) 报告回归，并注明对应矩阵行与场景。安全敏感问题请按 [SECURITY.md](SECURITY.md) 处理。
