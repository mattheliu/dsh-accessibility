# 贡献指南

欢迎改进读屏互操作、键盘操作、诊断、文档、测试证据和无障碍创作能力的贡献。参与者不需要加入 GitHub 组织。

## 贡献入口

- 无障碍障碍：使用无障碍障碍报告表单。
- 辅助技术结果：使用辅助技术测试表单；部分结果也欢迎。
- 功能或架构：先开 Issue，说明它应进入 DSH 核心、运行时 companion、开发 testkit、外部辅助技术实验室还是模型可见创作工具。
- 安全问题：使用 GitHub 私有漏洞报告。
- 行为事件：遵循 [`omdsh-dev/community` 行为准则](https://github.com/omdsh-dev/community/blob/main/CODE_OF_CONDUCT.zh-CN.md)，不得在公开 Issue 报告。

## 本地检查

```sh
pnpm install
pnpm run evidence:validate
pnpm run typecheck
pnpm test
pnpm run build
npm pack --dry-run
```

行为变更必须包含确定性测试。支持声明变化必须同步更新中英文无障碍文档，并注明精确浏览器、辅助技术版本、语言、场景、实际朗读和焦点结果。作为声明依据的真人证据还必须新增或更新受 [HUMAN-EVIDENCE.zh.md](HUMAN-EVIDENCE.zh.md) 约束的记录；失败和部分结果以 `claim: none` 保留，原始数据绝不能进入该公开记录。自动检查不能算作人工读屏认证。

真实 AT 观察应使用[核心实验室](AT-CORE-LAB.zh.md)验证静态核心任务，使用[实时播报实验室](AT-LIVE-LAB.zh.md)验证回答／工具／请求状态，针对 Accessible View 使用 [companion 实验室](AT-LAB.zh.md)，针对审批和修复使用[创作 AT 实验室](AUTHORING-AT-LAB.zh.md)，针对一次性终端候选使用 [CLI 实验室](CLI-ACCESSIBILITY.zh.md#人工终端与读屏实验室)。这些实验室都使用合成内容，并提供可复制、包含同意边界的结果记录。实验室成功启动本身不算 AT 结果。

宿主和客户端行为必须使用有文档的 DSH extension seam。不要修补生成 CSS 类，不要用 DOM 观察器重写宿主语义、焦点或键盘行为。任何新增的对话或工作区内容访问都必须先完成隐私评审，并与当前只读诊断边界明确区分。
