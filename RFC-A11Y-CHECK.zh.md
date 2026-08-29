# RFC：受权限控制的无障碍创作与 `a11y_check`

状态：供社区公开评审的实验性实现

报告模式版本：`1.0.0`

内置引擎：`html-validate@11.4.0`，配置 `web-static-1`

DSH API 基线：`0.1.1-rc.2`

跟踪 Issue：[omdsh-dev/dsh-accessibility#13](https://github.com/omdsh-dev/dsh-accessibility/issues/13)

## 决策

DSH 可以提供一个选择性启用的 Host 工具 `a11y_check`：它只读取一份已经授权的静态 HTML 文件，并返回确定性、版本化的证据报告。工具默认关闭；启用时必须配置至少一个明确的根目录；默认访问模式还会在每次读取前请求用户批准。首个引擎离线运行，使用本包自有的规则配置，而且不能写文件。

检测与模型解释、修复相互分离。引擎只报告固定版本规则检测到的结果。模型可以解释结果或提出修改建议，但任何修改都必须经过另一个 DSH write/edit 工具及其权限策略。`a11y_check` 不会静默改写、上传或发布内容。

本 RFC 不定义无障碍认证。自动报告通过不能证明 WCAG 合规、浏览器／无障碍 API 互操作、辅助技术输出正确或残障用户可用性。

## 范围与边界

版本 1 只接受 `web-static`：一份普通 UTF-8 HTML 文件。它不执行 JavaScript、不渲染 DOM、不加载 CSS 或图片、不访问 URL、不使用被检项目配置，也不运行被检项目插件。网页 URL、截图、原生移动应用、PDF、Office 文档、设计文件和实时应用无障碍树均不支持。未来每一种输入都必须先具备独立的权限契约、确定性 provider、威胁评审、限制说明和证据规程，才能加入本模式。

现有浏览器自检仍然只检查本地当前 DOM。Host 创作服务是另一项能力，不会让浏览器 companion 隐式获得工作区访问权限。

## 权限契约

该功能使用两个相互独立的钥匙：

1. DSH profile 必须设置 `authoring.enabled: true`，并提供非空的 `authoring.allowedRoots`。
2. 在默认 `approval` 模式下，DSH 的 `tools/pre-execute` 门禁会在读取内容前请求一次性批准。未安装批准服务时，调用会被拒绝。

每个根目录和目标文件都由 `ctx.fs` 解析。包含关系通过文件系统 provider 的规范化目标和 `ctx.fs.contains` 判断，不做字符串前缀比较。根目录必须解析为现有目录。相对根目录和文件路径以当前调用会话的工作目录为基准。路径穿越或符号链接别名解析到全部根目录之外时，会在读取内容前被拒绝。

`allowlist` 模式会取消逐次提示，但不会取消规范化根目录边界，只适合经过审查且足够狭窄的 profile。`maxBytes` 限制完整读取大小，`maxFindings` 限制报告中的结果数。工具没有网络客户端，也没有任何修改方法。

用户层 `cordis.patch.yml` 示例：

```yaml
- id: accessibility
  config:
    authoring:
      enabled: true
      access: approval
      allowedRoots:
        - ./examples/a11y-check
      maxBytes: 1048576
      maxFindings: 200
```

删除该 `config`，或设置 `authoring.enabled: false`，即可关闭或回滚。实现不维护创作数据库、不写文件、不持久化检查结果，因此回滚不需要数据迁移。

## 数据流

1. 模型或用户提供 `file_path`；缺失或非字符串参数会被拒绝。
2. 执行前门禁解析全部根目录和目标，验证根目录类型与规范化包含关系，并在需要时请求批准。
3. 授权后，工具检查目标状态，要求它是普通文件，执行字节上限，读取字节，记录字节长度和 SHA-256 内容标识，再以严格 UTF-8 解码。
4. consumer 只把 `{kind, 展示路径, 内容}` 交给已注册的创作引擎。内置引擎不会得到文件系统或网络能力。
5. 所有适用引擎都必须完成。任一 provider 失败会使整次调用失败；服务不会把部分输出伪装成完整证据。
6. 服务按确定顺序排列引擎和结果，应用结果数上限，并输出 `1.0.0` 报告。
7. DSH 展示报告。本包不会上传或持久化内容及报告。

## 确定性引擎

`web-static-1` 精确固定 `html-validate@11.4.0`，并在本包代码中逐条声明启用规则。它不使用 `extends`、项目内 `.htmlvalidate.*` 文件、项目模块或远程配置。启动时会核对所有规则 id 是否存在。每条结果包含引擎 id、精确引擎版本、配置版本、规则 id、严重性、源码位置、引擎提供的文档链接，以及本包维护的标准引用。

这些规则覆盖部分 HTML 与 ARIA 源码缺陷，例如缺少替代文本或标签、空标题、无效引用、隐藏但可聚焦内容、自动播放、无效角色、地标结构和若干 WCAG HTML 技术。完整规则表以 `HTML_VALIDATE_RULES` 导出；语义变化必须提升配置版本。

标准映射链接到 [WCAG 2.2](https://www.w3.org/TR/WCAG22/)、[WCAG 技术](https://www.w3.org/WAI/WCAG22/Techniques/)、[WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) 和 [HTML Living Standard](https://html.spec.whatwg.org/)。规则到成功准则的链接只用于导航和可追溯性，不表示一条规则能完整验证某项成功准则。引擎行为参考 [html-validate API](https://html-validate.org/guide/api/getting-started.html) 与[规则文档](https://html-validate.org/rules/)。

## 结果模式与证据类别

规范结果由 DSH 工具输出边界强制验证。代表性结构如下：

```json
{
  "schemaVersion": "1.0.0",
  "target": {
    "kind": "web-static",
    "path": "/authorized/example.html",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "byteLength": 0
  },
  "authorization": {
    "mode": "configured-root+approval",
    "configuredRootCount": 1,
    "approval": "allowed-once",
    "readOnly": true,
    "network": "none"
  },
  "engines": [
    { "id": "html-validate", "version": "11.4.0", "configVersion": "web-static-1", "findingCount": 2 }
  ],
  "outcome": "fail",
  "summary": { "errors": 1, "warnings": 1, "totalFindings": 2 },
  "findings": [],
  "findingsTruncated": false,
  "evidence": {
    "automated": "completed",
    "assistiveTechnology": "not-run",
    "disabledUser": "not-run"
  },
  "uncertainty": {
    "automatedCoverage": "partial",
    "renderedBehavior": "not-observed",
    "humanJudgment": "required"
  },
  "humanReviewRequired": [],
  "limitations": [],
  "certification": false
}
```

`error` 表示固定配置把该规则视为阻断性源码缺陷；`warning` 是确定性提示。替代文本质量、计算后对比度、键盘和动态状态、焦点、渲染布局、播报、辅助技术互操作、安全性、理解与任务完成等事项保留在 `humanReviewRequired`，引擎不会猜测结论。

目标摘要、字节长度、精确引擎和配置版本共同标识复检所需的输入与机制；证据系统还应保存命令、软件包锁、平台和源码 revision。报告始终区分三种证据：自动检查、具名真实辅助技术测试，以及在知情同意下进行的残障用户任务验证。本实现只能完成第一种，因此始终返回明确的“自动覆盖仅为部分”不确定性、`assistiveTechnology: not-run`、`disabledUser: not-run` 和 `certification: false`。

## 可信扩展 API

已安装的 Host 插件可以通过 `ctx.accessibilityAuthoring.registerEngine(engine)` 注册 `AccessibilityEngine`。引擎必须声明稳定的小写 id、精确实现版本、配置版本、支持的输入类型以及异步确定性检查。重复或格式错误的 provider 会被拒绝；注册随插件生命周期释放。

引擎属于可信的已安装代码。被检仓库、网页、模型参数或报告都不能指定要加载的模块。provider 只获得已经授权的 source 对象和取消信号；权限获取仍由 owning consumer 负责。新输入类型的 provider 不得借用 `web-static` 绕过新的权限与证据评审。

## 威胁模型

| 威胁 | 控制 | 剩余限制 |
| --- | --- | --- |
| 路径穿越、前缀混淆或符号链接逃逸 | provider 负责规范化解析与 `contains`；根必须是目录；读取前检查 | 安全性仍依赖文件系统 provider 正确维护 target/containment 契约 |
| 意外扩大工作区访问 | 默认关闭；非空根目录；默认逐次批准 | 管理者仍可主动配置过宽根目录或 `allowlist` |
| 私有源码外传 | 无网络、遥测、上传或项目规则加载；未实现报告持久化 | 其他单独安装的 DSH 工具有各自权限 |
| 被检内容中的提示词注入 | 引擎把内容视为源码；本包不会把内容加入提示词 | 后续模型解释仍须避免回显秘密，而且只是模型输出 |
| 恶意项目配置／插件 | 固定包内配置；不加载项目配置、`extends` 或项目模块 | 可信的已安装引擎 provider 拥有其 Host 插件自身权限 |
| 资源耗尽 | 普通文件检查、字节上限、结果上限、取消信号 | HTML 验证仍会在这些边界内占用 CPU |
| 部分或过期证据被当作完整证据 | provider 失败即整次失败；记录精确引擎／配置版本与截断状态 | 外部持久化证据时，consumer 必须把报告和源码 revision 一起保存 |
| 自动通过被误写成合规 | 明确的证据字段、人工检查表、限制及 `certification: false` | 文档和下游 UI 必须保留这些字段及措辞 |
| 未经审阅的自动修复 | 检查工具没有写能力；修复走独立 DSH 工具与策略 | 用户仍可能批准不良模型建议；必须审阅和复检 |

## 验收与发布策略

实验性版本至少要通过类型、单元、构建、包内容、权限反例、确定性样例与文档检查。稳定支持还要求隐私评审、至少一名残障开发者审阅该工作流，以及面向相关 DSH 核心任务的版本化真实辅助技术与残障用户证据。评审发现可以修改模式或权限模型；实现完成本身不能关闭证据门禁。

公开样例 [`examples/a11y-check`](examples/a11y-check/README.zh.md) 展示检测、独立的解释／建议、用户控制的修复与确定性复检。流程结尾会明确保留辅助技术和残障用户验证，而不会声称“完全无障碍”。
