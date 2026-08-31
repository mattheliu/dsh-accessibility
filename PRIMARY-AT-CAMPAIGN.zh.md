# VoiceOver、NVDA 与残障开发者首轮活动

简体中文 | [English](PRIMARY-AT-CAMPAIGN.md)

活动状态：`open`；现在可以提交真实 VoiceOver、NVDA 和残障开发者结果。活动规程：`dsh-a11y-primary-at-campaign/0.1.0-draft`。场景规程：`dsh-core-at-lab/1.0.0-draft`。机器可读状态：[PRIMARY-AT-CAMPAIGN.json](PRIMARY-AT-CAMPAIGN.json)。

首轮活动固定到 DSH `0.1.2-alpha.2` 精确 revision `5803bfcfdd502adac26ae9b8eec12d6aed263ec6` 与实验室精确 revision `6aed71615edd1db1ec5b12897e1ad40b79294c78`。这一组合已在 macOS 通过隔离 Chrome 启动与清理冒烟检查；另行重新生成的[三引擎浏览器报告](automated-evidence/core-browser/2026-08-31-dsh-0.1.2-alpha.2-5803bfcfdd.json)也在同一精确 DSH revision 上通过十四项确定性检查，并已绑定进机器清单。它们只证明实验室和自动浏览器就绪；账本仍有零条真人记录。

## 公开可用性与证据边界

活动开放前，已匿名核验精确核心与实验室 revision、本默认分支指南、双语提交表单、[Discussion 16](https://github.com/omdsh-dev/dsh-accessibility/discussions/16)、[NVDA Issue 1](https://github.com/omdsh-dev/dsh-accessibility/issues/1) 和 [VoiceOver Issue 2](https://github.com/omdsh-dev/dsh-accessibility/issues/2)。机器清单的五项 `availabilityGates` 均为 `ready`。

活动开放只是协调状态，不是真人无障碍证据。账本从零条真人记录开始；欢迎失败和部分结果，任何提交 Issue 都必须另行经过同意、去标识化、验证与公开评审，才能成为支持声明证据。

可随时匿名复核五项公开门禁：

```sh
pnpm run campaign:public:verify
pnpm run campaign:public:require
```

第一条命令总会输出带版本、隐私最小化的观察报告；严格命令只有在精确 revision、默认分支提交入口、Discussion 16 与 Issue 1／2 均无需凭据即可公开读取且为当前版本时才返回成功。两条命令都不会修改活动清单或创建真人证据。

维护者的公开顺序，以及默认分支 PR、Discussion 16 与 Issue 1／2 的受测试替换正文，见[首轮 AT 公开交接包](outreach/primary-at/README.md)。

## 本次开放活动的精确配置

```sh
git clone https://github.com/omdsh-dev/deepseek-harness.git
git -C deepseek-harness checkout 5803bfcfdd502adac26ae9b8eec12d6aed263ec6
pnpm --dir deepseek-harness install --frozen-lockfile
pnpm --dir deepseek-harness run build

git clone https://github.com/omdsh-dev/dsh-accessibility.git
git -C dsh-accessibility checkout 6aed71615edd1db1ec5b12897e1ad40b79294c78
pnpm --dir dsh-accessibility install --frozen-lockfile
```

VoiceOver + Safari 使用专门的干净 profile：

```sh
pnpm --dir dsh-accessibility run lab:at:core ../deepseek-harness safari
```

物理 Windows 上的 NVDA + Chrome 使用跨平台隔离 profile：

```sh
pnpm --dir dsh-accessibility run lab:at:core ../deepseek-harness chrome
```

启动器必须报告上面两个精确 revision。任一 checkout 不干净、revision 不一致、出现个人浏览器界面或一次性 fixture 以外内容时，立即停止。按 [AT-CORE-LAB.zh.md](AT-CORE-LAB.zh.md) 执行，然后每个环境／语言组合通过辅助技术表单单独提交。残障开发者使用同一精确实验室和专用结果表单；只有真实使用专门辅助技术时才记录。

## 首轮验收条件

- VoiceOver／Safari：九项可声明核心任务的每种已声明模态都有真人直接观察，每项 Web 任务至少有一条焦点转换。
- NVDA／Chrome：在物理 Windows 上完成同一精确任务集合，并记录浏览／焦点模式行为。
- 残障开发者核心任务：同一参与者在一个精确环境记录中独立、有效、安全地完成全部七项代表性核心任务。
- 失败与部分结果以 `claim: none` 保留为公开障碍，绝不能被改写成通过。
- 任何候选声明都必须通过 `pnpm run evidence:validate` 和公开评审；覆盖范围始终收窄，绝不能称为“完全无障碍”或认证。

同意、隐私、补偿、撤回、观察与评审规则见 [COMMUNITY-VALIDATION.zh.md](COMMUNITY-VALIDATION.zh.md)。
