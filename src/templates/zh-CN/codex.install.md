# ExMachina for Codex

ExMachina 现在提供面向 Codex 的原生安装面，可以同时把仓库里的 `skills/` 和 `agents/` 接入本地 Codex。

原始安装文档地址：

- `{{RAW_BASE_URL}}/codex/INSTALL.md`

## 你会得到什么

安装后，Codex 会得到三层入口：

- `using-exmachina-zh`：中文轻量引导与路由入口
- `using-exmachina-en`：英文轻量引导与路由入口
- `exmachina-zh`：中文主技能，负责严格的证据驱动、路由和裁决
- `exmachina-en`：英文主技能
- 一组原生智能体文件：`00_全连结指挥体`、`10-19` 连结指挥体、`30-70` 子个体，会被同步到 `~/.codex/agents/`

高级模式下，你还可以把 `codex/AGENTS.md` 合并到自己的 `~/.codex/AGENTS.md` 或项目 `AGENTS.md`，让 ExMachina 规则更强地常驻生效。

## 快速安装

仓库可以放在任意目录。下面统一用 `~/exmachina` / `$HOME/exmachina` 作为示例路径。

### macOS / Linux

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina
bash ./scripts/setup-exmachina.sh
```

### Windows PowerShell

```powershell
git clone {{REPOSITORY_URL}} "$HOME/exmachina"
Set-Location "$HOME/exmachina"
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
```

脚本支持三种模式：

- 默认直接安装
- `bash ./scripts/setup-exmachina.sh --verify`
- `bash ./scripts/setup-exmachina.sh --uninstall`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Verify`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall`

## 安装原理

安装脚本会做两件事：

- macOS / Linux：创建链接 `~/.codex/skills/exmachina -> <repo-root>/skills`
- Windows PowerShell：同步一个受 ExMachina 管理的目录到 `~/.codex/skills/exmachina`，并写入 `.exmachina-managed.txt`
- 把 `agents/` 里的编号智能体文件同步到 `~/.codex/agents/`
- 维护清单文件：`~/.codex/agents/.exmachina-installed-agents.txt`

脚本只会管理 ExMachina 自己的 skills 安装面和 agent 文件，不会主动删除其他无关条目。

仓库内的 `skills/` 和 `agents/` 都是已经生成好的可发现产物，因此普通安装用户不需要先运行 `npm install` 或 `npm run generate`。

## 验证安装

安装后，确认以下路径存在：

- `~/.codex/skills/exmachina/using-exmachina-zh/SKILL.md`
- `~/.codex/skills/exmachina/using-exmachina-en/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-zh/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-en/SKILL.md`
- `~/.codex/agents/00_全连结指挥体.md`
- `~/.codex/agents/19_实作连结指挥体.md`
- `~/.codex/agents/69_编码体.md`
- `~/.codex/agents/.exmachina-installed-agents.txt`

然后重启 Codex 会话，发起这些任务之一：

- “分析这个报错并给出修复路径”
- “做一次代码审查，先列风险再总结”
- “实现这个功能，但先锁边界和验证方式”

如果技能已生效，Codex 会更倾向于：

- 先收边界、再收证据、再执行
- 显式区分事实 / 推断 / 假设 / 决策
- 在高风险动作前说明验证与回退路径

## 更新

### macOS / Linux

```bash
cd ~/exmachina
git pull --ff-only
bash ./scripts/setup-exmachina.sh
```

### Windows PowerShell

```powershell
Set-Location "$HOME/exmachina"
git pull --ff-only
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
```

如果你修改了 `src/` 下的源码而不是只消费仓库产物，再执行：

```bash
npm install
npm run generate
npm run verify
```

## 卸载

优先使用脚本卸载：

### macOS / Linux

```bash
bash ./scripts/setup-exmachina.sh --uninstall
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall
Remove-Item "$HOME/exmachina" -Recurse -Force
```

如果你需要手动删除，步骤如下：

### macOS / Linux

```bash
rm ~/.codex/skills/exmachina
if [ -f ~/.codex/agents/.exmachina-installed-agents.txt ]; then
  while IFS= read -r name; do
    rm -f "$HOME/.codex/agents/$name"
  done < ~/.codex/agents/.exmachina-installed-agents.txt
  rm -f ~/.codex/agents/.exmachina-installed-agents.txt
fi
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
Remove-Item "$HOME/.codex/skills/exmachina" -Force
if (Test-Path "$HOME/.codex/agents/.exmachina-installed-agents.txt") {
  Get-Content "$HOME/.codex/agents/.exmachina-installed-agents.txt" |
    Where-Object { $_ } |
    ForEach-Object { Remove-Item (Join-Path "$HOME/.codex/agents" $_) -Force -ErrorAction SilentlyContinue }
  Remove-Item "$HOME/.codex/agents/.exmachina-installed-agents.txt" -Force
}
Remove-Item "$HOME/exmachina" -Recurse -Force
```

## 故障排查

- 如果 `~/.codex/skills/exmachina` 已存在且不是链接，安装脚本会停止，避免误删你的本地目录。确认无误后用 `--force` 或手动清理。
- 如果 `~/.codex/agents/` 里已经有同名文件，但看起来不是 ExMachina 管理的 agent，安装脚本会停止；确认要覆盖时再用 `--force`。
- 如果你只想检查当前安装状态，不改任何文件，可用 `--verify` / `-Verify`。
- 如果你在自定义 Codex 主目录下安装，可把 `CODEX_HOME` 设为目标目录，或给脚本传 `--codex-home` / `-CodexHome`。
- 如果你希望更强的常驻约束，把 `codex/AGENTS.md` 合并到自己的 `AGENTS.md`。

## 相关入口

- 仓库主页：`{{REPOSITORY_URL}}`
- Codex 使用说明：`codex/README.md`
- 打包产物入口：`plugin.json`
