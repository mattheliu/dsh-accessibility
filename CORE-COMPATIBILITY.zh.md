# DSH 无障碍核心兼容性台账

简体中文 | [English](CORE-COMPATIBILITY.md)

复审日期：2026-08-30。本台账记录源码兼容性和证据状态，不构成合规声明。

## 版本记录

| 记录 | 精确版本或 revision | 状态 |
| --- | --- | --- |
| 官方 npm 基线 | `@deepseek-ai/dsh@0.1.1-rc.2` | 2026-08-30 的 npm `latest` 与 `next` |
| rc.2 官方源码 | `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` | 不可变维护基线 |
| rc.2 完整补丁范围无障碍候选 | `dsh-v0.1.1-rc.2-a11y.4`，commit `3064d99cdc9653327e774b7306b839395b24a272` | 维护参考；真实辅助技术证据仍不完整 |
| 官方 alpha.1 源码 | `dsh-v0.1.2-alpha.1`，commit `cd5ef8148158c3a752a658978873241fdf8e2bbc` | 2026-08-30 的当前上游源码 HEAD；尚未发布到 npm |
| fork 可移植性基线 | `073359c4d5a5b284d60dbc052f5aa370b4639892` | 官方 alpha.1 加 16 个 fork CI、测试和终端修复 |
| alpha.1 部分无障碍候选 | PR [omdsh-dev/deepseek-harness#1](https://github.com/omdsh-dev/deepseek-harness/pull/1)，commit `6987ae3e70b1d39ec05050b1e43a436f0e74bac8` | 一次独立 Windows 原生测试重跑后自动化评审通过；核心移植范围不完整 |
| 已发布 companion | `@oh-my-dsh/dsh-accessibility@0.1.0-beta.6` | 仅精确匹配 rc.2 peer；2026-08-30 的 npm `beta` |

companion 的 npm `latest` 仍指向 `0.1.0-beta.3`，安装时必须明确指定 `0.1.0-beta.6`。不得强行把 rc.2 companion 安装到 alpha.1：其 peer 范围和结构化客户端接口尚未针对该版本线完成审查。

## rc.2 到 alpha.1 的处置清单

rc.2 候选在 alpha 之前的客户端中修改了 191 个路径。alpha.1 重组了 Web 客户端和测试 projection，因此文件路径相同不等于兼容。alpha.1 部分候选相对 fork 基线共修改 202 个路径，其中包括 117 个测试或快照路径。每项行为仍需明确处置。

状态含义：

- **已重建并自动验证：** 已标明 alpha.1 责任组件和确定性证据。
- **仅有自动证据：** 门禁可以观察某项属性，但不能证明真实辅助技术或残障用户可用。
- **待重新审计：** 没有重放 rc.2 补丁；当前 alpha.1 行为可能存在、变化或缺失，不能表述为已验证。

| rc.2 行为组 | alpha.1 处置 | 当前证据与剩余门禁 |
| --- | --- | --- |
| 共享弹窗的初始焦点、焦点约束、嵌套关闭、应用 inert 和已连接触发器焦点恢复 | 在 `Modal` 中**已重建并自动验证** | 聚焦组件测试和组装键盘路径通过；VoiceOver／NVDA 朗读、虚拟光标约束和真实使用方工作流仍待验证。 |
| 共享菜单按钮关系、方向键／Home／End／首字母导航、子菜单、Tab 退出和焦点返回 | 在 `Menu` 中**已重建并自动验证**；新增 Tooltip 触发器 ref 转发以适配 alpha.1 组合 | 组件和辅助功能树快照通过；真实辅助技术菜单播报及浏览器交互模式仍待验证。 |
| 应用 `main`、唯一的本地化 H1、具名 Session 导航／详情地标、关闭 Details 排除和键盘可调分隔条 | 在 alpha.1 shell 中**已重建并自动验证** | 组件、组装树、重排和键盘检查通过；真实缩放、放大镜、开关、语音输入及真实辅助技术任务证据仍待补。 |
| Context Meter disclosure 控制具名信息 region | **已重建并自动验证** | 组件和组装树证据通过；实际朗读的状态和关系仍待验证。 |
| 设置弹窗在 640／320 CSS px 下的重排、焦点可见／无遮挡和聚焦控件滚动 | **已重建并自动验证** | Chromium、Firefox、WebKit 门禁通过；CSS 像素等价不是真实 200%／400% 缩放证据。 |
| 减少动态效果和强制颜色参与 | alpha.1 跨浏览器门禁中**仅有自动证据** | 三个引擎运行减少动态效果，Chromium 强制颜色模拟通过；Windows 高对比度、系统颜色可用性和动态效果残障审查仍待补。 |
| Session／Workspace／搜索树、漫游焦点、展开键、折叠搜索排除和焦点恢复 | 在 Workspace 与 Session 树责任组件中**已重建并自动验证** | 分组、扁平与搜索结果树在聚焦和组装浏览器检查中暴露单一漫游行入口、显式层级、展开键与搜索焦点返回。真实辅助技术层级／虚拟光标输出和残障开发者任务证据仍待补。 |
| 模型选择器、命令 combobox／listbox 和弹出项高亮 | 在模型位与命令弹窗责任组件中**已重建并自动验证** | 模型菜单具有单一触发器入口、边缘打开、面板导航与触发器焦点恢复。命令搜索通过 active descendant 拥有其 listbox，并通过实际执行的 binder 注入把焦点还给确切 composer。真实朗读／盲文输出和残障开发者任务证据仍待补。 |
| Chat／Trajectory 标签页、Trajectory listbox／范围选择、ledger 键盘导航和详情分隔条 | 在 Chat 与 Trajectory 责任组件中**已重建并自动验证** | 具名且有归属的 tablist 只有一个漫游 Tab 停靠点，支持方向键／Home／End 并保持 panel 稳定。Trajectory active-descendant listbox 支持范围／全选和 Escape；虚拟 ledger 支持方向键／Home／End／Enter／Space；详情分隔条可用键盘调整。真实辅助技术朗读、盲文、虚拟光标操作及残障开发者任务证据仍待补。 |
| 用户问题单选组／自定义输入和反馈说明焦点管理 | 在用户问题 composer 中**已重建并自动验证** | 具名单选组使用漫游方向键／Home／End，自定义答案具有可访问字段，现代输入组合路径与旧式 key code 229 下的焦点转换均保持稳定；取消、错误和恢复路径已有自动化证据。真实辅助技术朗读／盲文、错误播报行为和残障用户任务证据仍待补。 |
| 对话 log 名称、用户／Assistant article、输入框名称和一次有界完成播报 | 在 `ChatView`、`ChatNodeSeat` 与 `MessageItem` 中**已重建并自动验证** | 对话记录是具名非实时 log，并暴露运行状态；持久用户消息与 Assistant 步骤是具名 article。初始已稳定历史和流式分块保持静默，只在实际观察到运行转为空闲后创建一次原子 polite 状态。聚焦组件测试、91 文件组装快照和 Chromium／Firefox／WebKit 对话场景均通过。精确读屏朗读、盲文输出、长对话导航、中断行为和残障开发者任务证据仍待补。 |
| 工具 disclosure、稳定朗读名称和独立文件操作 | 在 `DisclosureRow` 与文件 `ToolRow` 中**已重建并自动验证** | 可视行本身是普通内容；独立具名的原生 disclosure 按钮拥有 `aria-expanded` 并响应 Enter／Space，另一个独立具名的打开文件按钮在激活时不会切换 disclosure。聚焦组件测试、冷历史快照及托管 Chromium／Firefox／WebKit 键盘场景均通过。精确朗读／盲文输出、真实宿主文件打开、工具批准／失败、破坏性操作理解、恢复和残障开发者任务证据仍待补。 |
| 插件列表语义、JSON 树和子智能体 lineage 树 | **待重新审计** | 尚无 alpha.1 处置记录；层级朗读、漫游／虚拟光标操作、状态变化与任务有效性仍需审查。 |
| 图片灯箱、首次配置、Workspace／目录弹窗及其他 Modal 使用方 | **待重新审计** | 共享 Modal 已覆盖，但每个使用方都必须证明命名、初始焦点、关闭策略和焦点恢复。 |
| 主题文本对比度和非颜色状态提示 | **待重新审计** | rc.2 token 改动没有作为一组完成移植评审；需要自动对比度检查和两套主题下的低视力审查。 |
| Linux／macOS／Windows 发布工作流和组装应用扫描 | **已替换为版本化确定性证据** | 候选 CI 的仓库矩阵和聚焦 Chromium／Firefox／WebKit 门禁均通过；这仍是 `a11y-automated-reviewed`，不是 `a11y-at-tested`。 |

## 候选证据

GitHub Actions 测试的精确候选为 PR #1 的 `6987ae3e70b1d39ec05050b1e43a436f0e74bac8`。[Actions run 33291309798，第 2 次 attempt](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798) 最终成功，覆盖必需的无障碍浏览器矩阵、Node 22／24／26、Linux 与 Windows 穷尽覆盖率、Windows 构建／原生／观察性及 Wine 通道、Python 发布形态矩阵、包组装、快照和汇总状态。最终无障碍浏览器 job 为 [99205674953](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99205674953)，快照／产物 job 为 [99205680775](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99205680775)，Linux 覆盖率为 [99205666353](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99205666353)，Windows 覆盖率为 [99205678903](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99205678903)，Windows 原生测试为 [99205665754](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99205665754)，汇总 job 为 [99205854888](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99205854888)。

无障碍浏览器 job 中，Chromium 8 个场景全部通过；Firefox 通过 8 个场景中的 7 个，按能力边界跳过强制颜色场景；WebKit 同样通过 7 个并跳过 1 个。快照 job 的 91 个 Web 测试文件全部通过，320 个测试中 307 个通过、13 个按条件跳过；其中冷历史文件操作场景通过 12 个测试中的 11 个，跳过仅用于录制的 1 个。Linux 覆盖率通过 997 个文件中的 990 个、16,061 个测试中的 16,020 个；Windows 覆盖率通过 960 个文件中的 957 个、15,373 个测试中的 15,348 个。两个平台的语句、分支、函数和行覆盖率均为 100%。

当前运行历史被完整保留，没有改写成一路通过。第 1 次 attempt 唯一失败的是 [Windows 原生测试 99203312942](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33291309798/job/99203312942)：一个 Vitest fork worker 在第 5 个文件完成前意外退出；已完成的 4 个文件报告 33 个测试通过、1 个跳过，没有失败断言。其余 job 均通过，包括完整快照、跨浏览器无障碍、Linux 覆盖率和 Windows 覆盖率门禁。只在全新 runner 上重跑一次失败 job，5 个文件全部通过，69 个测试通过、1 个跳过，随后汇总门禁通过。没有豁免任何断言，重跑历史仍属于证据边界。

紧邻的前一检查点也被保留。`4bbbc5bb115d72e80c538563af4d782bc104e0c6` 的 [run 33290741103](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33290741103) 通过了三引擎无障碍矩阵，但快照 job 失败：role locator 在所属 Turn 仍隐藏时就尝试发现文件按钮，造成两个直接超时及两个共享页面后续 golden 不匹配。commit `6987ae3e70b1d39ec05050b1e43a436f0e74bac8` 先定位 DOM 行、展开所属 Turn，再执行 role 查询；上面的最终 91 文件快照通过，没有修改 golden，也没有豁免断言。

更早的验证历史同样保留。早期 `ee2420bcf34a0932db682c3dc3d77fe126fe2358` 检查点之后，扩大范围的候选在 [run 33277553260](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33277553260) 的 Windows 覆盖率中，第一次因两个过期 projection-cache 断言及一个凭据锁 `EPERM` 失败，重跑后仍在 turn-end 检查点出现一个过期值。重复结果定位出真实产品竞态：同一 session 的新旧 projection 写入可能不按调用顺序提交。commit `01d4eb8fce45e2643dfccb88ef451e69bbc1a91d` 对每个 session 的写入进行了串行化；其 [run 33279877992](https://github.com/omdsh-dev/deepseek-harness/actions/runs/33279877992) 的 Windows 原生测试和其他所有 job 均通过，但 Windows coverage 暴露出新顺序回归测试在重负载下仍依赖 5 秒文件系统轮询窗口。`0f65b7f13b343c096f3e901889753c81feaa8155` 检查点改为等待较新写入 Promise，作为确定性的队列屏障，同时让 spill 清理的相等边界测试比较文件系统实际保存的时间戳。没有放弃任何失败断言，那个更早的检查点也不需要重跑。

这些结果只为已经实现的行提供确定性的源码、构建、键盘、DOM、浏览器辅助功能树、重排等价、焦点几何、减少动态效果和强制颜色模拟证据。它们不能证明精确读屏朗读、盲文输出、目标实机操作系统无障碍 API 行为、独立任务完成、有效性、安全性或残障用户认可。

## 兼容性决定

alpha.1 部分候选可以评审，但**不能**替代 `dsh-v0.1.1-rc.2-a11y.4`、扩大 companion peer 范围、授权发布 alpha.1 npm 包，也不能支持“完整无障碍”声明。只有所有待处理行完成处置并通过证据门禁，同时具备当前 VoiceOver、NVDA 任务记录和依据 [RESEARCH.zh.md](RESEARCH.zh.md) 取得的残障开发者任务证据，才可考虑替代。

回滚依靠版本选择，不依靠 DOM 修补：使用不可变 rc.2 维护参考和精确 beta.6 companion，或返回官方未修改 DSH 版本并记录缺失行为。不得把只由 companion 遮盖的宿主缺陷表述为已修复。

## 下次复审触发条件

以下任一项变化时复审本台账：

- 上游 DSH 源码 HEAD 或已发布 npm 版本线；
- 待处理或已验证行涉及的客户端责任组件；
- companion peer 范围或结构化 projection；
- 作为证据使用的浏览器、操作系统或辅助技术大版本；
- 会改变支持决定的真实辅助技术或残障用户结果。
