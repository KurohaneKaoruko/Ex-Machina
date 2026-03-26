# ExMachina for Codex

ExMachina 现在提供面向 Codex 的原生安装面，可以同时把仓库里的 `skills/` 和 `agents/` 接入本地 Codex。

原始安装文档地址：

- `https://raw.githubusercontent.com/KurohaneKaoruko/Ex-Machina/main/.codex/INSTALL.md`

## 你会得到什么

安装后，Codex 会得到三层入口：

- `using-exmachina-zh`：中文轻量引导与路由入口
- `using-exmachina-en`：英文轻量引导与路由入口
- `exmachina-zh`：中文主技能，负责严格的证据驱动、路由和裁决
- `exmachina-en`：英文主技能
- 一组原生智能体文件：`00_全连结指挥体`、`10-19` 连结指挥体、`30-70` 子个体，会被同步到 `~/.codex/agents/`

如果你希望 Codex 更稳定地进入 ExMachina 模式，不要只装技能；继续把 ExMachina 的常驻指导块安装到 `~/.codex/AGENTS.md`。这一步会显著增强“绝对理性、任务优先、语言不带情感”的持续约束。仓库内对应的安装面位于 `.codex/`。

## 快速安装

仓库可以放在任意目录。下面统一用 `~/exmachina` / `$HOME/exmachina` 作为示例路径。

### macOS / Linux

```bash
git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/exmachina
cd ~/exmachina
bash ./scripts/setup-exmachina.sh
bash ./scripts/setup-exmachina.sh --install-guidance
```

### Windows PowerShell

```powershell
git clone https://github.com/KurohaneKaoruko/Ex-Machina "$HOME/exmachina"
Set-Location "$HOME/exmachina"
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance
```

如果你要把英文版常驻指导写入 `~/.codex/AGENTS.md`，再加一层语言参数：

```bash
bash ./scripts/setup-exmachina.sh --install-guidance --guidance-language en
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance -GuidanceLanguage en
```

脚本支持五种模式：

- 默认直接安装
- `bash ./scripts/setup-exmachina.sh --verify`
- `bash ./scripts/setup-exmachina.sh --uninstall`
- `bash ./scripts/setup-exmachina.sh --install-guidance`
- `bash ./scripts/setup-exmachina.sh --remove-guidance`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Verify`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance`
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -RemoveGuidance`

## 安装原理

安装脚本会管理三类安装面：

- macOS / Linux：创建链接 `~/.codex/skills/exmachina -> <repo-root>/skills`
- Windows PowerShell：同步一个受 ExMachina 管理的目录到 `~/.codex/skills/exmachina`，并写入 `.exmachina-managed.txt`
- 把 `agents/` 里的编号智能体文件同步到 `~/.codex/agents/`
- 维护清单文件：`~/.codex/agents/.exmachina-installed-agents.txt`
- 可选地把 `.codex/AGENTS.md` 或 `.codex/AGENTS.en.md` 作为受管理块写入 `~/.codex/AGENTS.md`

常驻指导块带有显式边界标记：

- `# >>> ExMachina managed block >>>`
- `# <<< ExMachina managed block <<<`

脚本只会管理 ExMachina 自己的 skills 安装面、agent 文件和受管理指导块，不会主动删除其他无关条目。

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
- 如果已安装常驻指导：`~/.codex/AGENTS.md`

然后重启 Codex 会话，发起这些任务之一：

- “分析这个报错并给出修复路径”
- “做一次代码审查，先列风险再总结”
- “实现这个功能，但先锁边界和验证方式”

如果技能已生效，Codex 会更倾向于：

- 先收边界、再收证据、再执行
- 显式区分事实 / 推断 / 假设 / 决策
- 在高风险动作前说明验证与回退路径
- 在默认输出里保持任务优先、语言不带情感，不再退回原本的聊天化口吻

## 更新

### macOS / Linux

```bash
cd ~/exmachina
git pull --ff-only
bash ./scripts/setup-exmachina.sh
bash ./scripts/setup-exmachina.sh --install-guidance
```

### Windows PowerShell

```powershell
Set-Location "$HOME/exmachina"
git pull --ff-only
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance
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
bash ./scripts/setup-exmachina.sh --remove-guidance
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -Uninstall
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -RemoveGuidance
Remove-Item "$HOME/exmachina" -Recurse -Force
```

如果你需要手动删除，步骤如下：

### macOS / Linux

```bash
bash ./scripts/setup-exmachina.sh --remove-guidance
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
powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -RemoveGuidance
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
- 如果你希望更强的常驻约束，用 `--install-guidance` / `-InstallGuidance` 安装受管理指导块，而不是手工复制。
- 如果你希望英文版常驻指导，用 `--guidance-language en` / `-GuidanceLanguage en`，脚本会写入 `.codex/AGENTS.en.md` 的内容。

## 相关入口

- 仓库主页：`https://github.com/KurohaneKaoruko/Ex-Machina`
- Codex 使用说明：`.codex/README.md`
- 英文常驻指导：`.codex/AGENTS.en.md`
- 打包产物入口：`plugin.json`
