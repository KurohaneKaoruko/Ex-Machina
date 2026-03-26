# ExMachina for OpenCode

ExMachina 现在提供了仓库原生的 OpenCode 插件入口。

## 入口结构

- `package.json` 的 `main` 指向 `.opencode/plugins/exmachina.mjs`
- 仓库根目录提供 `.opencode/INSTALL.md`

OpenCode 安装时不需要再手工建 symlink；插件会在运行时把 `skills/` 注册到 OpenCode 的技能路径里，并把 ExMachina 的引导内容注入系统提示。

## 安装

在 `opencode.json` 的 `plugin` 数组中加入：

```json
{
  "plugin": [
    "exmachina@git+{{REPOSITORY_URL}}.git"
  ]
}
```

然后重启 OpenCode 会话。

## 语言选择

插件会优先按环境语言选择引导 Skill：

- `LANG` / `LC_ALL` 以 `zh` 开头时，默认加载中文引导
- 其他情况下，默认加载英文引导

你也可以显式设置：

```bash
EXMACHINA_LANG=zh
EXMACHINA_LANG=en
```

## 验证

确认这些入口存在：

- `.opencode/plugins/exmachina.mjs`
- `skills/using-exmachina-zh/SKILL.md`
- `skills/using-exmachina-en/SKILL.md`

然后启动一次需要分析与执行闭环的任务。若插件生效，ExMachina 会在不手工加载技能的前提下，更倾向于先边界、后证据、再执行。

## 相关入口

- 根 OpenCode 插件入口：`.opencode/plugins/exmachina.mjs`
- 根安装文档：`.opencode/INSTALL.md`
