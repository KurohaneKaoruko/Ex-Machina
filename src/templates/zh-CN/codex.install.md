# ExMachina for Codex

ExMachina 现在提供面向 Codex 的原生安装面，直接把仓库里的 `exmachina/skills/` 目录接入你的本地 Codex 技能库。

原始安装文档地址：

- `{{RAW_BASE_URL}}/exmachina/codex/INSTALL.md`

## 你会得到什么

安装后，Codex 会发现这一组技能：

- `using-exmachina-zh`：中文轻量引导与路由入口
- `using-exmachina-en`：英文轻量引导与路由入口
- `exmachina-zh`：中文主技能，负责严格的证据驱动、路由和裁决
- `exmachina-en`：英文主技能

高级模式下，你还可以把 `exmachina/codex/AGENTS.md` 合并到自己的 `~/.codex/AGENTS.md` 或项目 `AGENTS.md`，让 ExMachina 规则更强地常驻生效。

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

## 安装原理

安装脚本会创建这样一条本地链接：

- `~/.codex/skills/exmachina -> <repo-root>/exmachina/skills`
- 例如：`~/.codex/skills/exmachina -> ~/exmachina/exmachina/skills`

仓库内的 `exmachina/skills/` 是已经生成好的可发现技能目录，因此普通安装用户不需要先运行 `npm install` 或 `npm run generate`。

## 验证安装

安装后，确认以下路径存在：

- `~/.codex/skills/exmachina/using-exmachina-zh/SKILL.md`
- `~/.codex/skills/exmachina/using-exmachina-en/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-zh/SKILL.md`
- `~/.codex/skills/exmachina/exmachina-en/SKILL.md`

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

删除技能链接，再删除仓库目录：

### macOS / Linux

```bash
rm ~/.codex/skills/exmachina
rm -rf ~/exmachina
```

### Windows PowerShell

```powershell
Remove-Item "$HOME/.codex/skills/exmachina" -Force
Remove-Item "$HOME/exmachina" -Recurse -Force
```

## 故障排查

- 如果 `~/.codex/skills/exmachina` 已存在且不是链接，安装脚本会停止，避免误删你的本地目录。确认无误后用 `--force` 或手动清理。
- 如果你在自定义 Codex 主目录下安装，可把 `CODEX_HOME` 设为目标目录，或给脚本传 `--codex-home` / `-CodexHome`。
- 如果你希望更强的常驻约束，把 `exmachina/codex/AGENTS.md` 合并到自己的 `AGENTS.md`。

## 相关入口

- 仓库主页：`{{REPOSITORY_URL}}`
- Codex 使用说明：`exmachina/codex/README.md`
- 打包产物入口：`exmachina/plugin.json`
