# ExMachina for OpenClaw

ExMachina 提供面向 OpenClaw 的原生安装面，把金字塔式多智能体体系接入 OpenClaw 的 workspace 与多 agent 舰队机制。

原始安装文档地址：

- `{{RAW_BASE_URL}}/dist/openclaw/INSTALL.md`

## 接入原理

OpenClaw 的接入点与其余平台不同：它没有项目内规则目录，而是以 gateway 配置（`~/.openclaw/openclaw.json`）和 agent workspace 为中心：

- workspace 内的 `AGENTS.md` 会在每个会话开始时注入
- workspace 内的 `skills/` 目录是优先级最高的技能位置
- 主会话通过 `sessions_spawn` 派发子代理，子代理完成事件自动回流
- 子代理嵌套深度由 `agents.defaults.subagents.maxSpawnDepth` 控制，默认为 `1`，必须显式提升到 `2` 才能形成「主控 → 连结指挥体 → 子个体」两层金字塔

ExMachina 在 `dist/openclaw/` 下提供两种安装模式：

| 模式 | 机制 | 适用场景 |
|------|------|----------|
| lite（默认） | workspace 内容安装 + 子代理嵌套配置，不新增任何 agent entry | 单个主力 agent 兼任全连结指挥体 |
| full | 注册 `exmachina-main` 与 19 个连结指挥体为原生 agent entries，各自拥有独立 workspace 与角色提示词 | 需要独立主控体、按连结体隔离记忆与身份 |

两种模式互斥使用，后续可从 lite 升级到 full。

## 前置条件

- OpenClaw gateway 已安装并可用（需要 Node.js，安装脚本同样依赖 Node.js）
- 主 agent 会话中存在 `sessions_spawn` 工具（默认编码工具画像自带；若没有，见故障排查）
- 不需要修改模型或 provider 配置：所有 ExMachina agent 继承宿主默认模型

## 快速安装

仓库可以放在任意目录。下面统一用 `~/exmachina` 作为示例路径。

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina

# lite 模式：workspace 内容安装 + 开启两层子代理嵌套
node scripts/apply-openclaw-settings.mjs

# full 模式：额外注册原生 agent 舰队
node scripts/apply-openclaw-settings.mjs --mode full
```

脚本行为：

- 合并 `agents.defaults.subagents` 嵌套参数到 `~/.openclaw/openclaw.json`（写入前自动备份为 `<target>.exmachina.bak`）
- lite 模式：把 `skills/` 下五个技能目录复制到 workspace `skills/`，并把主协定 + OpenClaw 派发规约作为受管理块写入 workspace `AGENTS.md`
- full 模式：展开 `{{EXMACHINA_PACK_ROOT}}` 后深合并 `agents.entries`，不触碰 channels、bindings 与模型配置

常用参数：

```bash
node scripts/apply-openclaw-settings.mjs --verify      # 检查安装状态，不做任何修改
node scripts/apply-openclaw-settings.mjs --uninstall   # 移除受管理内容与 entries
node scripts/apply-openclaw-settings.mjs --dry-run     # 只打印计划，不写文件
node scripts/apply-openclaw-settings.mjs --no-agents-md  # lite 模式跳过 AGENTS.md 受管理块
node scripts/apply-openclaw-settings.mjs --target ~/.openclaw/openclaw.json --workspace ~/.openclaw/workspace
```

## lite 模式安装结果

安装后，workspace 内出现：

```text
<workspace>/
├── AGENTS.md                 # 原有内容 + ExMachina 受管理块（显式边界标记）
└── skills/
    ├── exmachina-zh/         # 中文主技能（含 agents/protocol 参考）
    ├── exmachina-en/         # 英文主技能
    ├── using-exmachina-zh/   # 中文轻量引导
    ├── using-exmachina-en/   # 英文轻量引导
    └── using-exmachina/      # 引导别名
```

同时 `~/.openclaw/openclaw.json` 中出现受管理的 `agents.defaults.subagents` 嵌套参数。

使用方式：主 agent 直接接收任务，按主协定的路由层级派发子代理；子代理任务文本由主 agent 依据 `agents/` 与 `skills/exmachina-zh/references/agents/` 中的角色提示词组装。金字塔的两层分别对应：

- 第一层（主控）：当前主会话，兼任全连结指挥体
- 第二层（连结指挥体 → 子个体）：`sessions_spawn` 派发的子代理，任务文本指定角色与输入

## full 模式安装结果

安装后，`~/.openclaw/openclaw.json` 的 `agents.entries` 中新增：

- `exmachina-main`：全连结指挥体，workspace 指向 `<仓库>/dist/openclaw/workspaces/exmachina-main`，允许派发全部 19 个连结指挥体
- `exmachina-link-<slug>`（19 个）：各连结指挥体，workspace 指向 `<仓库>/dist/openclaw/workspaces/exmachina-link-<slug>`，各自加载角色 AGENTS.md

仓库内 `dist/openclaw/workspaces/` 的目录结构：

```text
dist/openclaw/workspaces/
├── exmachina-main/AGENTS.md            # 全连结指挥体 + 资源地图与派发规约
├── exmachina-link-knowledge/AGENTS.md  # 知识连结指挥体 + 附录
├── exmachina-link-rationality/AGENTS.md
└── ...（共 20 个 workspace）
```

主控体的使用入口（任选其一）：

- Control UI / 会话中显式切换到 `exmachina-main`
- 为 `exmachina-main` 添加 bindings，把某个渠道账号路由给它
- 从你自己的主力 agent 中用 `sessions_spawn` 以 `agentId: "exmachina-main"` 派发（需要在该 agent 的 `subagents.allowAgents` 中加入 `exmachina-main`）

注意：为现有配置追加多个 agent entries 后，OpenClaw 的路由会进入显式模式（原默认路由可能需要 bindings 兜底）。安装后运行 `openclaw doctor` 检查路由与归属状态，必要时用 `openclaw doctor --fix` 修复。

## 验证安装

```bash
node scripts/apply-openclaw-settings.mjs --verify
```

或手动确认：

- lite：workspace `AGENTS.md` 含 `# >>> ExMachina managed block >>>`；`<workspace>/skills/exmachina-zh/SKILL.md` 存在
- full：`~/.openclaw/openclaw.json` 的 `agents.entries` 含 `exmachina-main` 与 `exmachina-link-knowledge`

然后向主 agent（或 `exmachina-main`）发起这些任务之一：

- “分析这个报错并给出修复路径”
- “做一次代码审查，先列风险再总结”

如果安装生效，agent 会先收边界与证据，再按连结体路由派发子代理，回流内容带有 `[角色]:` 标记与证据分级。

## 更新与卸载

```bash
cd ~/exmachina
git pull --ff-only
node scripts/apply-openclaw-settings.mjs            # 重新应用当前模式
node scripts/apply-openclaw-settings.mjs --uninstall
```

脚本只管理 ExMachina 自己的 entries、受管理块与带 `.exmachina-managed.txt` 标记的技能目录，不会删除其他无关内容。

## 故障排查

- 主会话没有 `sessions_spawn` 工具：为对应 agent 设置 `tools.profile: "coding"`，或在 `tools.allow` 中加入 `sessions_spawn` 与 `subagents`。
- 子代理无法再派发子代理：确认 `agents.defaults.subagents.maxSpawnDepth` 已合并为 `2`（默认是 `1`）。
- 配置合并报错：脚本要求目标配置是合法 JSON；先用 `openclaw doctor --fix` 清理，再重试。`--allow-missing` 允许在目标配置不存在时创建最小配置。
- full 模式后渠道消息路由异常：多 agent 舰队没有隐式默认路由，为原有 agent 补 bindings，或运行 `openclaw doctor --fix`。
- 自定义 gateway 状态目录：传 `--target` 与 `--workspace` 显式指定路径。

## 相关入口

- 仓库主页：`{{REPOSITORY_URL}}`
- fleet 设置模板：`dist/openclaw/openclaw.settings.json`（full）、`dist/openclaw/openclaw.settings.lite.json`（lite）
- 仓库根 `AGENTS.md`：主协定全文
- 打包产物入口：`plugin.json`
