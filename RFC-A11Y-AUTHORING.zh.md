# RFC：确定性无障碍创作支持

[English](RFC-A11Y-AUTHORING.md) | 简体中文

状态：draft。规程：`dsh-a11y-testkit/0.1.0-draft` 与 `dsh-a11y-authoring/0.1.0-draft`。

## 问题

DSH 应帮助作者发现并修复无障碍障碍，但不能声称自动扫描足以证明 WCAG 符合性。实现还必须让残障开发者可以使用，不得静默读取或公开敏感产品内容，并保留 DSH 现有文件系统、网络、沙箱与批准边界。

本设计以 [WCAG 2.2](https://www.w3.org/TR/WCAG22/) 为 Web 内容目标，以 [ATAG 2.0](https://www.w3.org/TR/ATAG20/) 为创作工具指导。ATAG Part A 覆盖 DSH 自身可访问性，Part B 覆盖引导作者、检查内容、定位结果、报告状态和提供修复协助。规则元数据采用 [ACT Rules Format 1.1](https://www.w3.org/TR/act-rules-format/) 的透明度目标，但提供方规则只有满足该规范时才能称为 ACT Rule。完整符合性声明需要 [WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/) 所述的范围与抽样、专家评估、报告及持续有效性；自动结果本身永远不能形成该声明。

## 目标与非目标

第一版必须：

- 对明确选择的已渲染页面运行确定性检查；
- 返回版本化、机器可读的报告，包含提供方／规则版本、WCAG 映射、结果、位置、修复帮助、限制和计数；
- 区分已检测失败与需要人工判断的项目；
- 默认不在报告中包含页面 HTML、截图、Cookie、凭据或响应正文；
- 让本地测试和 CI 使用同一个引擎，而无需加载 DSH runtime；
- 让未来模型可见的 `a11y_check` 适配器可以请求扫描，但不能因此取得修改权限；
- 保留足以帮助作者定位问题的信息，同时警告 selector 可能包含项目数据。

它不能认证页面、站点、应用、组织或发行版；不能取代人工键盘、读屏、低视力、认知、语音、开关控制或残障用户评估；不能判断替代文本在上下文中是否恰当；也不能静默修复源码。

## 三个发布与信任边界

| 边界 | 职责 | 权限 | 发布方式 |
| --- | --- | --- | --- |
| 确定性引擎 | 把提供方结果规范化为稳定报告，并约束证据措辞 | 纯数据变换；无文件系统、浏览器、网络、剪贴板或进程权限 | testkit 自有小型库 |
| `dsh-a11y-testkit` | 启动或接收隔离浏览器页面、运行锁定版本的确定性提供方并输出版本化报告 | 开发／CI 进程；无 DSH 模型工具 | 独立开发依赖和 CLI |
| `a11y_check` 适配器 | 向 DSH agent 暴露受限只读扫描并呈现可行动结果 | 既有 DSH 工具策略加显式浏览器／网络批准；无写方法 | 独立、选择性启用的 DSH 插件 |

runtime companion 继续负责 DSH 自身诊断和无障碍 UI。它不能因为托管项目文档就获得通用浏览器自动化、工作区扫描或模型可见工具。

## 报告契约

一次运行输出一个 `dsh-a11y-testkit/0.1.0-draft` 对象：

```json
{
  "protocol": "dsh-a11y-testkit/0.1.0-draft",
  "generatedAt": "2026-08-31T00:00:00.000Z",
  "subject": { "kind": "page", "label": "local-page" },
  "engine": { "name": "axe-core", "version": "4.x" },
  "standards": ["WCAG 2.2 A", "WCAG 2.2 AA"],
  "summary": { "failed": 1, "needsReview": 0, "passedRules": 0, "inapplicableRules": 0 },
  "findings": [],
  "limitations": []
}
```

每个 finding 包含提供方规则 ID、`failed` 或 `needs-review` 结果、提供方给出的 impact、标准 tag、帮助文本及 URL，以及一个或多个位置。位置默认包含提供方 selector，绝不包含序列化 HTML。提供方原始输出不是公开规程；新增或升级提供方不能静默改变报告结构。

`passedRules` 只表示该提供方在当前被测页面状态中报告其自有规则通过。某一条自动规则通过，不代表对应 WCAG 成功准则“通过”。`findings` 为空只表示“这些规则在此状态没有发现”，绝不表示“无障碍”或“符合 WCAG”。

字段或语义的破坏性变化必须升级规程版本。提供方升级还要单独显示在 `engine.version` 中，并重新评审 fixture。

## Testkit 执行边界

库接收调用方已经拥有的 Playwright 兼容 page。它注入本地锁定版本的提供方资源并取回结构化结果。第一版不导航、不启动服务器、不读取工作区、不附带 Cookie、不截图，也不上传任何内容。这样可复用引擎保持 hermetic，由各产品测试自行负责鉴权状态和披露决定。

未来 CLI 默认只能导航到 loopback HTTP(S)。远程 origin、自定义 header、持久浏览器 profile、鉴权状态、跨域资源、下载、弹窗和 service worker 都需要单独设计和批准。CLI 或适配器必须使用新的临时浏览器 profile，限制时间和输出，关闭全部 context，并且不得打印签名 URL。

## 模型可见 `a11y_check` 边界

未来选择性启用的工具只有一个职责：请求扫描，返回受限报告与修复指导。它不编辑文件。源码修改继续经过 DSH 现有 read／edit 工具、沙箱策略、已观察版本检查、diff 呈现和用户批准。

最小调用指定由调用方拥有的本地页面 handle 或 loopback URL，并可选标准／规则范围。适配器必须：

1. 通过注入的浏览器审计 service 解析目标，不能直接 import 具体浏览器或文件系统 backend；
2. 没有兼容隔离提供方时闭合失败；
3. 拒绝 URL 凭据、任意请求 header、Cookie、文件 URL、`data:` URL及非 loopback 导航，除非另有明确暴露的批准路径；
4. 传播取消，并实施配置的时间、页面、finding、node 和字节上限；
5. 把提供方失败作为工具错误返回，不能伪装成干净报告；
6. 在模型可见文本中标记每个自动结果及限制；
7. 不注册 write、fix、certification、score 或“使其合规”操作。

修复帮助要说明受影响要求、位置、重要原因、仍需什么证据，以及一个或多个作者选择。不得生成通用或基于文件名的替代文本。任何候选替代文本都必须可编辑，并在插入前让作者接受、修改或拒绝，遵循 ATAG 2.0 B.2.3.2。

## 隐私与威胁模型

渲染页面和 selector 可能包含机密产品数据。因此报告使用调用方提供的非敏感 subject label，默认排除 DOM snippet，并保持本地，除非调用方主动保存。公开证据必须按 [RESEARCH.zh.md](RESEARCH.zh.md) 脱敏。

浏览器把页面视为恶意内容。自有 runner 必须隔离 profile、禁用下载及非预期外部导航、约束弹窗、运行后关闭 context，并在页面内容执行前应用网络策略。创作适配器不得继承用户日常浏览器 profile 或环境鉴权。页面仍可能通过被允许请求的资源泄露数据，因此 loopback-only 导航不等同于内容隔离。

Selector 可能暴露名称、ID、测试数据或应用结构。它们对程序化关联和本地修复有必要，但公开导出器必须提供人工检查／脱敏步骤，或用稳定本地 finding ID 代替。

## 证据与发布门禁

确定性引擎必须有 failed、needs-review、passed、inapplicable、畸形、超限及提供方错误输入的单元 fixture。浏览器适配器必须针对无障碍页面和故意失败页面运行组装测试，检查精确包内容、取消／清理，并以隐私断言证明不含序列化 HTML。

模型可见适配器还必须具备 DSH 工具 schema snapshot、文件系统／网络拒绝测试、每项扩权的批准测试、取消与输出保留测试、提示语言评审，以及真实 agent 任务：开发者可以定位并修复 finding，而工具自身没有编辑任何内容。

稳定创作支持仍要求残障开发者使用完整流程、具名辅助技术读取报告和修复交互，并人工评审自动化无法判断的问题。测试数量、axe 分数或自动扫描干净都不足以作为发布证据。

## 推进顺序

1. 以实验性开发包发布纯报告契约和首个页面审计 testkit。
2. 迁移 companion 的组装浏览器断言来使用 testkit，不改变其证据范围。
3. 等导航与清理策略测试存在后，再增加 loopback-only CLI。
4. 让选择性启用的 `a11y_check` DSH 适配器依赖注入的审计 service，而不是直接依赖 Playwright。
5. 用 VoiceOver 与 NVDA 验证报告阅读和修复，再由残障开发者完成代表性创作任务。
6. 只有经过单独版本化规则、证据和权限评审后，才扩展到已渲染 Web 页面之外。
