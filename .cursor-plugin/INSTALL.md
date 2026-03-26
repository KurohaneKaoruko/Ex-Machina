# ExMachina for Cursor

ExMachina 现在同时提供两条 Cursor 接入面：

- 仓库级插件 manifest：`.cursor-plugin/plugin.json`
- 规则回退面：`.cursor/rules/exmachina.mdc`

## 推荐路径

优先把整个仓库作为插件源安装，让 Cursor 直接读取 `.cursor-plugin/plugin.json`。这样可以把 skills、agents、commands 和 hooks 一次接入，而不是只粘贴规则文件。

如果你当前的 Cursor 版本还没有可用的仓库插件安装入口，再退回到 `.cursor/rules/*.mdc` 的规则安装方式。

## 插件清单会暴露什么

`.cursor-plugin/plugin.json` 会把这些路径注册给 Cursor：

- `../skills/`
- `../agents/`
- `../commands/`
- `./hooks.json`

## 仓库安装

先把仓库克隆到本地：

```bash
git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/exmachina
cd ~/exmachina
```

然后在 Cursor 的插件入口中选择仓库根目录，让它读取：

```text
~/exmachina/.cursor-plugin/plugin.json
```

如果你的环境更适合从 Git 仓库读取插件源，也可以直接使用仓库根目录作为插件源；关键是让 Cursor 读取根目录 `.cursor-plugin/plugin.json`。

## 规则回退安装

如果暂时不能走插件安装，可以退回到规则模式：

1. 打开 Cursor Rules
2. 复制 `.cursor/rules/exmachina.mdc`
3. 如果你主要使用英文工作流，复制 `.cursor/rules/exmachina-en.mdc`

## 验证

确认这些文件存在：

- `.cursor-plugin/plugin.json`
- `.cursor-plugin/hooks.json`
- `.cursor/rules/exmachina.mdc`

然后在 Cursor 中发起一次需要分析和实现闭环的任务。若安装面生效，模型应更明显地表现为：

- 先锁边界，再收证据
- 显式区分事实 / 推断 / 假设 / 决策
- 在高风险动作前说明验证与回退路径

## 相关入口

- 根插件 manifest：`.cursor-plugin/plugin.json`
- 根插件 hooks：`.cursor-plugin/hooks.json`
- 中文规则：`.cursor/rules/exmachina.mdc`
- 英文规则：`.cursor/rules/exmachina-en.mdc`
