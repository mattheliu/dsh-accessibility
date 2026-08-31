# 无障碍创作 alpha 发布预检

规程：`dsh-a11y-authoring-alpha-preflight/0.1.0-draft`。机器可读契约：[AUTHORING-ALPHA-PREFLIGHT.schema.json](AUTHORING-ALPHA-PREFLIGHT.schema.json)。

本预检把六包策略转换成依赖优先的发布计划，并检查本地 alpha 发布者真正需要的精确状态。它刻意不修改外部状态：只读查询 GitHub、Git 远端与 npm registry，把每个干净、精确的 checkout 打包到一次性目录，输出一个受限 JSON 报告，再删除 tarball。

即使仍有阻塞，也可运行诊断报告：

```sh
pnpm run authoring:alpha:report
```

正式发布前使用闭合失败门禁：

```sh
pnpm run authoring:alpha:preflight
```

门禁要求：

- 精确仓库元数据、公开可见性、`main` 分支、干净本地 revision、匹配策略的 origin 身份，以及远端分支上的同一 revision；
- 本地 npm 发布者已认证；
- 每个精确版本在公共 registry 中仍不存在；
- 公开包访问与 `alpha` dist-tag，绝不使用 `latest`；
- 六个源码都能在一次性目录成功打包；
- 依赖顺序为 `testkit → authoring → providers → compositions`，彼此独立的包放在同一层。

预检绝不会创建或修改 GitHub 仓库，不会 push、tag、发布、预留包名或修改 npm 分发 tag。通过结果只代表一个时间点的发布前置条件，不构成无障碍符合性、真实辅助技术证据或残障用户验证。
