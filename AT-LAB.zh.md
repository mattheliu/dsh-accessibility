# 隔离式辅助技术实验室

简体中文 | [English](AT-LAB.md)

状态：公开评审中的探索性规程

协议：`dsh-at-lab/1.0.0-draft`

跟踪：[VoiceOver #2](https://github.com/omdsh-dev/dsh-accessibility/issues/2)、[NVDA #1](https://github.com/omdsh-dev/dsh-accessibility/issues/1)及 [Accessible View #10](https://github.com/omdsh-dev/dsh-accessibility/issues/10)

本规程验证 `0.1.1-rc.2` companion 与 Accessible View。当前 `0.1.2-alpha.2` 核心候选请使用独立的 [DSH 核心 AT 实验室](AT-CORE-LAB.zh.md)。

## 目的与证据边界

启动器会创建一次性、无密钥的 DSH Web 环境，通过真实 ModuleLoader 加载精确外部 companion，并写入 DSH 仓库中的合成 seeded-history fixture。这样可以在不接触测试者日常 DSH profile 的前提下，观察真实 VoiceOver、NVDA、Narrator、JAWS、Orca、盲文显示器、放大镜、开关、语音输入及纯键盘行为。

实验室成功启动、无障碍树可读或 VoiceOver 字幕面板显示文字，都不等于读屏通过。有效 AT 结果仍需由人实际观察语音或盲文、焦点／光标行为、任务完成、错误及变通方式。残障用户证据还必须取得知情同意，并只保留去标识化任务记录。

## 精确候选环境

先构建带 tag 的 DSH 基线和候选分支：

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
git clone https://github.com/omdsh-dev/dsh-accessibility.git

cd deepseek-harness
git checkout dsh-v0.1.1-rc.2-a11y.4
pnpm install
pnpm run build:official

cd ../dsh-accessibility
git checkout feat/hermetic-at-lab
pnpm install --frozen-lockfile
pnpm run build
```

在 companion checkout 中选择一种启动方式：

```sh
# 只输出本地 URL，不打开浏览器（所有平台）。
pnpm run lab:at ../deepseek-harness . none

# 打开系统默认浏览器（所有平台）。
pnpm run lab:at ../deepseek-harness . system

# 在 macOS 打开真实安装的 Safari 或 Google Chrome。
pnpm run lab:at ../deepseek-harness . safari
pnpm run lab:at ../deepseek-harness . chrome
```

启动器会输出带版本的 JSON readiness 记录，包括精确 Git revision、操作系统、本地 origin 和明确限制。临时本地登录地址会单独打印：只在本机使用，实验室运行期间不要粘贴进公开结果。启动器不会创建截图、录音、上传或公开 artifact。完成后返回终端按 Ctrl+C 请求清理，启动器会删除一次性 DSH home、会话存储、工作区和临时插件链接。浏览器中已经失效的本地标签页需手动关闭。

仅做自动启动／清理冒烟检查时，可传入毫秒超时：

```sh
pnpm run lab:at ../deepseek-harness . none 1000
```

该结果只证明实验室能够启动和清理，不是辅助技术证据。

## 人工观察步骤

任务开始前记录 macOS／Windows／Linux build、浏览器版本、AT 名称／版本、语言、语音、详细度、标点、companion revision 和精确 DSH revision。

只使用合成会话，然后依次：

1. 不用指针找到 DSH 应用标题和主要地标。
2. 在会话树中定位并打开合成会话。
3. 移动到 Accessible view 标签页并激活。
4. 确认激活 Load reading view 前没有对话正文，隐私提示可以理解。
5. 加载阅读视图；记录标题朗读、焦点目标、记录数量／状态及来源顺序是否容易理解。
6. 在浏览／阅读模式中浏览标题、记录、代码、链接、工具展开项；需要网页键盘焦点的控件再使用普通 Tab。
7. 展开／收起工具输出，核对名称、展开状态、内容边界和焦点稳定性。
8. 复制一条可见消息；记录播报，并确认隐藏上下文、推理、工具材料、路径和来源元数据没有被复制。
9. 清除阅读视图；确认敏感正文已卸载，焦点返回 Load reading view。
10. 返回 Chat，仅用键盘走完普通路径，不依赖指针恢复。

VoiceOver 使用转子、VO+左／右、VO+空格，以及控件需要时的 Tab／Shift+Tab。NVDA 需分别测试浏览模式和焦点模式并记录切换。不要把异常朗读“修正成预期措辞”；在不泄露无关内容的前提下，按可复现程度记录原始结果。

## 可复制结果模板

```md
### AT 实验室结果

- 日期时间及测试者时区：
- 同意公开这份去标识化结果：是／否
- 残障用户证据：否／是（只记录测试者自愿披露且与任务相关的使用需求）
- 操作系统及 build：
- 浏览器及精确版本：
- AT 及精确版本：
- UI／语音语言、语音、详细度、标点：
- DSH revision：
- Companion revision：
- 输入／输出设备：

| 任务 | 实际语音／盲文及焦点／光标结果 | 是否独立完成 | 变通方式 | 通过／失败 | 严重度 |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |
| 8 | | | | | |
| 9 | | | | | |
| 10 | | | | | |

- 意外播报、重复、静默或光标陷阱：
- 恢复路径：
- 经同意并完成脱敏的证据链接（如有）：
- 复核者及复核日期：
```

VoiceOver 结果提交到 Issue #2，NVDA 结果提交到 Issue #1；Accessible View 特有发现还应引用 Issue #10。部分结果和失败结果同样有价值，必须按实际状态标注。

## 隐私与安全

- 不得使用日常 DSH home、真实工作区、API key、提示词、对话、用户名或私人路径。
- 实验室运行期间不得公开本地登录地址。
- 未逐帧／逐行复核并取得可识别参与者同意前，不得公开原始语音历史、屏幕／音频录制、日志、截图或盲文输出。
- 如果浏览器打开非本地 URL、出现意外账号／个人 profile 界面，或合成内容无法与个人数据区分，应立即停止。
- 启动器异常时仍应清理自身状态；若进程被强制终止，只检查终端打印的操作系统临时目录中专用 lab 前缀，并把该精确目录移到废纸篓，绝不能删除宽泛临时目录或 home。
