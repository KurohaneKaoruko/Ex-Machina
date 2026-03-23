# ExMachina for Codex

ExMachina 把 Codex 使用面拆成三层：

1. 安装层
通过 `exmachina/codex/INSTALL*.md` 和根目录 `scripts/setup-exmachina.*` 把仓库 `exmachina/skills/` 目录注册到本地 Codex 技能库。

2. 引导层
`using-exmachina-zh` 和 `using-exmachina-en` 负责在“值得更严格工作流”的任务里触发 ExMachina 风格，而不要求每次都显式点名。

3. 核心层
`exmachina-zh` / `exmachina-en` 负责真正的机械智能行为约束：边界收拢、证据分级、冲突裁决、最小可逆执行、验证闭环。

## 推荐使用方式

- 普通安装用户：按 `exmachina/codex/INSTALL.md` 或 `exmachina/codex/INSTALL.en.md` 安装技能即可。
- 重度用户：再把 `exmachina/codex/AGENTS.md` 合并进自己的 `~/.codex/AGENTS.md` 或项目 `AGENTS.md`。
- 贡献者：编辑 `src/`，然后运行 `npm run generate && npm run verify`。

## 技能职责

### `using-exmachina-zh` / `using-exmachina-en`

适合自动触发或会话起始时使用，职责是：

- 判断任务是否值得进入 ExMachina 模式
- 给出最小足够的路由建议
- 在不过度加重简单任务负担的前提下，提升复杂任务的纪律性

### `exmachina-zh` / `exmachina-en`

适合这些高价值任务：

- 调试与根因定位
- 代码实现与重构
- 验证与回归
- 代码审查、安全审查、架构审查
- 高风险或高不确定性的复杂交付

## 为什么这样拆

如果只有一个大技能，自动发现和实际使用会出现两个问题：

- 简单任务被强行套上重流程，交互会变重
- 复杂任务又不一定会稳定触发最严格的行为约束

因此这里把“安装与引导”和“核心执行纪律”拆开：

- `using-exmachina-*` 负责发现与接入
- `exmachina-*` 负责严肃执行

## 目录约定

仓库里与 Codex 直接相关的关键路径：

- `exmachina/codex/INSTALL.md`
- `exmachina/codex/INSTALL.en.md`
- `exmachina/codex/README.md`
- `exmachina/codex/README.en.md`
- `scripts/setup-exmachina.sh`
- `scripts/setup-exmachina.ps1`
- `exmachina/skills/using-exmachina-zh/SKILL.md`
- `exmachina/skills/using-exmachina-en/SKILL.md`
- `exmachina/skills/exmachina-zh/SKILL.md`
- `exmachina/skills/exmachina-en/SKILL.md`
- `exmachina/codex/AGENTS.md`

## 版本与来源

- 仓库：`https://github.com/KurohaneKaoruko/Ex-Machina`
- 安装文档 Raw URL：`https://raw.githubusercontent.com/KurohaneKaoruko/Ex-Machina/main/exmachina/codex/INSTALL.md`
- 当前打包版本：`0.1.0`
