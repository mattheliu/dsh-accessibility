# 无障碍创作包发布就绪度

六个无障碍创作组件分别承担独立的能力和评审边界。`AUTHORING-PACKAGES.json` 固定其包名、精确预发布版本、职责、内部依赖图、精确 `omdsh-dev` 仓库元数据，以及不会占用 `latest` 的 `alpha` 分发 tag。运行：

```sh
pnpm run authoring:readiness
```

默认命令输出机器可读报告，并保留全部阻塞项。只有每个检出都具备干净的精确 Git revision、与策略仓库身份匹配的 origin、精确 npm 元数据与安全文档、公开访问与 `alpha` dist-tag，并且内部依赖都使用可从 registry 安装的精确版本时，`pnpm run authoring:readiness:require` 才会以零状态退出。

该报告不会执行测试，也不构成无障碍声明。发布前仍需分别运行各包的 typecheck、测试、覆盖率、构建、包内容、隔离 tarball 安装和真实 DSH 创作门禁。真实辅助技术和残障作者证据继续作为 `EVIDENCE-COVERAGE.zh.md` 中的独立要求。

当所有源码检出均干净，且内部依赖都改为策略固定的精确版本后，运行 `pnpm run authoring:install`。该命令会重新打包六个检出，在一次性消费项目中仅通过 tarball override 安装两个顶层组合，并导入全部包。它能证明发布清单不再依赖相邻源码目录，但不会声称这些包已经存在于 npm。
