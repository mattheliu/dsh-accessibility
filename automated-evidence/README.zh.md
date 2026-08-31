# 自动化证据归档

[English](README.md) | 简体中文

本目录归档经过评审、固定到精确 revision 的机器证据。它与只保留经过同意和去标识真人记录的 [`evidence/`](../evidence/README.md) 有意分离。

`core-browser/` 保存由 [`CORE-BROWSER-EVIDENCE.schema.json`](../CORE-BROWSER-EVIDENCE.schema.json) 和仓库测试套件校验的 `dsh-core-browser-non-at` 记录。`pass` 只证明精确 DSH revision 与环境中已登记的无头浏览器检查，不属于辅助技术、真实缩放、Windows 高对比度、WCAG 符合性或残障用户证据。

归档同时保留首份经过评审的 `33eb2d9e1e` 记录，以及为首轮活动精确候选另行重新生成的 `5803bfcfdd` 记录；后续提交不会自动继承任一结果。

不得通过编辑生成记录来使它通过。应从干净 DSH commit 重新生成，评审局限，逐字节复制，并在失败或部分记录能够说明障碍时保留它们。
