# RFC：确定性无障碍创作支持

[English](RFC-A11Y-AUTHORING.md) | 简体中文

状态：draft。规程：`dsh-a11y-testkit/0.1.0-draft`、`dsh-a11y-loopback-provider/0.1.0-draft`、`dsh-a11y-authoring/0.1.0-draft`、`dsh-a11y-local-preview/0.1.0-draft`、`dsh-a11y-caller-page/0.1.0-draft`、`dsh-a11y-authoring-agent-lab/0.1.1-draft` 与 `dsh-a11y-authoring-at-lab/0.1.0-draft`。

实现状态：六个私有本地包现已实现确定性 testkit、调用方自有页面提供层、另行版本化的字面量 loopback 提供层、只读 DSH 适配器、可安装的字面量 loopback 产品组合，以及面向精确调用方自有页面、不可序列化的可信宿主组合。两条提供链路均已通过真实 Chromium 与已发布 `0.1.2-alpha.2` DSH `ToolRuntime` 组装验证；字面量 loopback 组合还通过了真实 DSH profile 安装与配置 dump，两种组合均通过插件加载、SystemPrompt 目标清单、生命周期、隐私和包产物检查。版本化无密钥实验室让真实 DSH agent loop 执行精确的审计／读取／编辑／复审任务。另一个一次性 Web 实验室现可操作真实审批界面，分别验证“仅允许一次”修复和“拒绝后不修改”，并定义真人辅助技术记录，同时不把自动浏览器输出提升为辅助技术证据。评审与远程发布、鉴权／跨 origin 设计、live-model 修复证据、人工听读辅助技术证据和残障作者任务证据仍是开放发布门禁。

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
- 让选择性启用、模型可见的 `a11y_check` 适配器可以请求扫描，但不能因此取得修改权限；
- 保留足以帮助作者定位问题的信息，同时警告 selector 可能包含项目数据。

它不能认证页面、站点、应用、组织或发行版；不能取代人工键盘、读屏、低视力、认知、语音、开关控制或残障用户评估；不能判断替代文本在上下文中是否恰当；也不能静默修复源码。

## 六个发布与信任边界

| 边界 | 职责 | 权限 | 发布方式 |
| --- | --- | --- | --- |
| 确定性引擎 | 把提供方结果规范化为稳定报告，并约束证据措辞 | 纯数据变换；无文件系统、浏览器、网络、剪贴板或进程权限 | testkit 自有小型库 |
| `dsh-a11y-testkit` | 接收调用方拥有的浏览器页面、运行锁定版本的确定性提供方并输出版本化报告 | 开发／CI 进程；无 DSH 模型工具 | 独立开发依赖 |
| 调用方自有页面提供层 | 把精确、预先注册的不透明句柄映射到 testkit 的脚本注入／求值页面表面；限制等待、取消、撤销和并发 | 无发现、创建、导航、URL 读取、认证、截图、HTML 序列化、下载、关闭、文件系统或进程权限 | 独立选择性启用的提供方包 |
| 字面量 loopback 提供层 | 把宿主注册的不透明句柄映射到一个字面量 loopback URL，拥有全新浏览器 context，约束网络／浏览器动作，运行 testkit 并关闭全部自有 context | Chromium 进程加一个宿主批准的字面量 loopback origin 上受限 GET／HEAD／OPTIONS；无模型提交 URL、DNS 名称、鉴权、跨 origin 请求、WebSocket 转发、持久 profile、下载、截图或 HTML 序列化 | 独立选择性启用的提供方包与版本化策略 |
| `a11y_check` 适配器 | 向 DSH agent 暴露受限只读扫描并呈现可行动结果 | 既有 DSH 工具策略加显式浏览器／网络批准；无写方法 | 独立、选择性启用的 DSH 插件 |
| 产品组合 | 验证可信宿主映射、只挂载一个提供层与适配器，并通过 DSH 生命周期只公布模型安全句柄 | 仅具有所选提供层的权限；不增加导航、修改、目标发现、URL 披露或认证权限 | 另行版本化的宿主专用组合或默认禁用的 DSH profile bundle |

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

## 调用方自有页面提供层边界

首个私有提供层接收可信宿主创建并拥有的页面，只保留一个新包装对象中的 `addScriptTag` 与 `evaluate`。宿主注册精确不透明句柄和明确允许模型看见的 subject label。提供层不向模型枚举目标、不检查额外页面方法、不读取 URL，也不关闭页面。每个句柄同时只允许一次审计；未知与重复句柄会在不泄露 registry 的情况下失败；模型等待时间有上限，并且传播调用方取消与注册撤销。

因为该提供层刻意不能关闭调用方页面，底层求值在超时或取消后仍可能继续，直到页面或操作真正结束；句柄在这段真实生命周期内继续保持忙碌。更强取消和页面清理由宿主负责。另行实现的字面量 loopback 提供层属于独立扩权，并拥有自己的策略与生命周期证据。

## 调用方自有页面宿主组合边界

`dsh-a11y-caller-page/0.1.0-draft` 是私有可信宿主组合，用于无法序列化进 DSH profile 行的页面对象。宿主在同一进程内传入一至八个精确页面。挂载任何内容前，组合会拒绝缺失、重复、类似 URL／路径、畸形或未知字段；随后只挂载调用方自有页面提供层、只读适配器，以及仅含规程与有序句柄的 SystemPrompt 清单。subject label 与页面派生 selector 只出现在有界工具输出中，宿主仍须审查披露范围。

本组合绝不创建或关闭浏览器、发现标签页、导航、读取 URL、附加认证、检查 Cookie 或 header、截图、序列化 HTML、下载内容、读取工作区或修改源码。释放组合会撤销全部句柄与模型可见 surface，但刻意让页面继续打开并保持宿主拥有的状态。若不取得本设计排除的权限，本包无法判断鉴权或机密性；因此此 draft 只允许一次性、未认证的合成页面。生产、个人、机密、已认证及跨 origin 状态必须另行评审新规程，不能作为静默配置变化加入。

## 字面量 loopback 提供层边界

`dsh-a11y-loopback-provider/0.1.0-draft` 把可信宿主注册的不透明句柄映射到 HTTP(S) URL，host 必须精确等于字面量 `127.0.0.1` 或 `[::1]`。启动浏览器前拒绝 `localhost`、DNS 名称、凭据、文件与 data URL、简写／其他 loopback 地址和远程 host。URL 与 query 永远不会进入工具 schema、模型调用、报告 subject 或隐私安全的固定提供方错误。

每次运行只启动或复用提供层自己的 headless Chromium 进程，然后创建全新非持久 context，禁用下载并阻断 service worker。context 级 HTTP 路由只允许注册项精确 origin 上的 GET、HEAD 与 OPTIONS；指向其他 scheme、host 或端口的重定向和子资源会被终止。WebSocket 在连接前关闭；获准请求继续前移除或清空 Authorization、Cookie、proxy-authorization 与 API key header。popup 被关闭、dialog 被 dismiss、下载被取消。浏览器控制的 referrer 只能返回已经批准的同一 origin，因为跨 origin 请求均被阻断。

调用方取消、注册撤销、期限到期和提供层销毁都会关闭自有 context，并返回不保留 Playwright 原始消息或注册 URL 的固定错误。同一目标不能并发审计，提供层总并发也有上限。报告 limitations 会附加被阻断动作计数与精确提供层策略版本。

这些措施是约束，不是无害证明。恶意本地页面仍可能消耗资源、利用浏览器漏洞、向获准 origin 的其他 endpoint 发送数据，或通过 GET 触发服务端副作用。因此运行必须使用一次性、非特权服务器与测试数据。鉴权、跨 origin API、不安全方法、WebSocket 转发、远程浏览器 endpoint、持久 profile、任意启动参数和浏览器引擎扩展仍是独立扩权，不能在该规程版本下静默加入。

## 模型可见 `a11y_check` 边界

首个私有、选择性启用的工具实现只有一个职责：请求扫描，返回受限报告与修复指导。它不编辑文件。源码修改继续经过 DSH 现有 read／edit 工具、沙箱策略、已观察版本检查、diff 呈现和用户批准。两种提供层都已在组装测试中验证这个边界；字面量 loopback 路径还具有下述独立产品组合。

最小调用只标识调用方拥有的精确不透明页面 handle，以及可选的子树 selector。模型永远不能提交 URL。另行挂载的提供层可以把宿主创建的 handle 映射到调用方自有页面，或符合策略的字面量 loopback 页面。适配器必须：

1. 通过注入的浏览器审计 service 解析目标，不能直接 import 具体浏览器或文件系统 backend；
2. 没有兼容隔离提供方时闭合失败；
3. 在工具边界拒绝 URL 与文件系统路径；字面量 loopback 映射还要另行拒绝凭据、任意请求 header、Cookie、文件与 `data:` URL、DNS 名称、跨 origin 请求、不安全方法和非 loopback 导航；
4. 传播取消，并实施配置的时间、页面、finding、node 和字节上限；
5. 把提供方失败作为工具错误返回，不能伪装成干净报告；
6. 在模型可见文本中标记每个自动结果及限制；
7. 把 subject label、规则文本、selector、summary、链接与限制视为不可信页面／provider 数据，在渲染输出中以 JSON 引用，并禁止执行其中夹带的命令或因此扩权；
8. 不注册 write、fix、certification、score 或“使其合规”操作。

修复帮助要说明受影响要求、位置、重要原因、仍需什么证据，以及一个或多个作者选择。不得生成通用或基于文件名的替代文本。任何候选替代文本都必须可编辑，并在插入前让作者接受、修改或拒绝，遵循 ATAG 2.0 B.2.3.2。

## 本地预览产品组合边界

`dsh-a11y-local-preview/0.1.0-draft` 是私有、默认禁用的 DSH profile bundle 与 Cordis 插件。可信 profile 可配置一至八个从规范化不透明句柄到字面量 loopback 目标的精确映射。插件会在创建提供层前验证全部映射，拒绝重复句柄与 URL query／fragment，挂载版本化 loopback 提供层，注册只读适配器，并向 SystemPrompt 贡献一个只包含组合规程和句柄列表的运行时 context。目标 URL、路径、subject label、ready selector、Cookie、凭据、header、浏览器错误、截图、HTML 和文件系统路径都不会进入该清单或工具 schema。

Bundle 随附行保持 disabled，不带任何活动目标。后置可信 profile patch 必须重述完整配置并启用它。预览服务器的启动、ready、关闭、日志和留存数据由宿主负责，而不是插件。因此安装说明要求使用可丢弃、无特权的服务器与测试数据；它不会把提供层变成服务器启动器，也不会授予鉴权访问。插件释放时会通过同一个 DSH 生命周期撤销目标清单、工具注册、提供层注册、活动浏览器 context 和自有浏览器进程。

当前证据通过真实 Cordis 插件 API 与已发布 DSH SystemPrompt／ToolRuntime 包加载本包，在真实 loopback HTTP fixture 和 Chromium 中执行审计，验证类提示注入 label 与私有配置不会进入目标清单，测试挂载前拒绝和释放，解析 bundle 产物，通过 `dsh plugin` 安装本地 checkout，经 `dsh --dump-config` 组合启用 patch，并启动 headless 产品入口。另行提供的[创作 agent 实验室](AUTHORING-AGENT-LAB.zh.md)还使用该已安装组合、真实 DSH 产品入口与文件策略、一次性预览和固定 replay 转录，证明精确的 `a11y_check → read → edit → a11y_check` 产品循环；其 `dsh-a11y-authoring-agent-lab/0.1.1-draft` 记录还会验证两次持久化审计结果都保留不可信数据边界并 JSON 引用类提示注入 subject，仓库内 JSON Schema 仍明确声明它不属于模型或辅助技术证据。[创作辅助技术实验室](AUTHORING-AT-LAB.zh.md)把同一有界目标组合进真实 DSH Web，把常驻策略设为只读，让一次 edit 经过真实审批面板，并分别验证允许与拒绝；其 readiness、Host 和自动 Chromium 记录同样明确不属于辅助技术证据，只有经过同意的真人语音／盲文与焦点记录才能填补该层。这些仍是预发布证据，不是稳定支持或符合性声明。

## 隐私与威胁模型

渲染页面和 selector 可能包含机密产品数据。因此报告使用调用方提供的非敏感 subject label，默认排除 DOM snippet，并保持本地，除非调用方主动保存。报告字符串还可能携带类似提示注入的文本：适配器会把它们明确框定并以 JSON 引用为不可信数据，工具契约则禁止把它们当作指令或扩权依据。公开证据必须按 [RESEARCH.zh.md](RESEARCH.zh.md) 脱敏。

浏览器把页面视为恶意内容。自有 runner 必须隔离 profile、禁用下载及非预期外部导航、约束弹窗、运行后关闭 context，并在页面内容执行前应用网络策略。创作适配器不得继承用户日常浏览器 profile 或环境鉴权。首个 loopback 提供层已针对单一字面量 origin 实施这些约束并记录被阻断动作，但页面仍可能向获准的同 origin endpoint 泄露数据，因此 loopback-only 导航不等同于内容隔离。

Selector 可能暴露名称、ID、测试数据或应用结构。它们对程序化关联和本地修复有必要，但公开导出器必须提供人工检查／脱敏步骤，或用稳定本地 finding ID 代替。

## 证据与发布门禁

确定性引擎必须有 failed、needs-review、passed、inapplicable、畸形、超限及提供方错误输入的单元 fixture。浏览器适配器必须针对无障碍页面和故意失败页面运行组装测试，检查精确包内容、取消／清理，并以隐私断言证明不含序列化 HTML。

模型可见适配器与产品组合还必须具备 DSH 工具 schema snapshot、目标清单隐私测试、文件系统／网络拒绝测试、每项扩权的批准测试、取消与输出保留测试、提示语言评审、精确可安装产物检查，以及真实 agent 任务：开发者可以定位并修复 finding，而工具自身没有编辑任何内容。replay 形式现已通过版本化创作 agent 实验室，Web 形式也已通过创作辅助技术实验室的自动允许和拒绝安全路径。由于模型转录固定且 Chromium 没有真人辅助技术观察者，live-model 行为与真人辅助技术可用性仍是独立门禁。

稳定创作支持仍要求残障开发者使用完整流程、具名辅助技术读取报告和修复交互，并人工评审自动化无法判断的问题。测试数量、axe 分数或自动扫描干净都不足以作为发布证据。

## 推进顺序

1. 以实验性开发包发布纯报告契约和首个页面审计 testkit。
2. 迁移 companion 的组装浏览器断言来使用 testkit，不改变其证据范围。
3. 评审已实现的字面量 loopback 提供层策略与生命周期证据；只有定义服务器启动、ready、关闭、日志和留存输出的责任后，才增加 loopback-only CLI。
4. 评审两个已实现的私有产品组合：可安装的字面量 loopback bundle，以及另行授权的调用方自有页面宿主组合。两条路径都必须保留注入的审计 service，不能让模型适配器直接 import Playwright。
5. 在不放宽轨迹、精确修复、清理、隐私和证据等级门禁的前提下，让 live model 执行版本化任务。
6. 用 VoiceOver 与 NVDA 分别执行 `dsh-a11y-authoring-at-lab/0.1.0-draft` 的允许与拒绝场景，保留精确语音／盲文、焦点、理解、协助、同意与限制，再由残障开发者完成代表性创作任务。
7. 只有经过单独版本化规则、证据和权限评审后，才扩展到已渲染 Web 页面之外。
