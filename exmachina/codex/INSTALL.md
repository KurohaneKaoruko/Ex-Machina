# ExMachina 安装说明

ExMachina 设计为可以通过项目链接直接安装，也可以通过原始文件链接安装。

## 项目链接安装

发布仓库后，优先让安装器读取：

- `exmachina/plugin.json`

如果目标环境不识别根清单，则读取：

- `exmachina/codex/INSTALL.md`
- `exmachina/codex/exmachina/SKILL.md`
- `exmachina/skills/exmachina-zh/SKILL.md`

## Raw URL 模式

发布后使用如下模式：

- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/exmachina/plugin.json`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/exmachina/claude-plugin/plugin.json`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/exmachina/codex/exmachina/SKILL.md`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/exmachina/skills/exmachina-zh/SKILL.md`

## 命令别名

- `/ex`
- `/excodex`
- `/exclaude`
