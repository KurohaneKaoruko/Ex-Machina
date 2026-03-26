# ExMachina for Claude Code

ExMachina 现在提供了更接近仓库原生插件模式的 Claude Code 接入面：

- 仓库根目录：`.claude-plugin/plugin.json`
- 仓库根目录：`.claude-plugin/marketplace.json`

## 设计思路

核心内容仍然只维护在 `skills/`、`agents/`、`commands/`、`hooks/`。Claude 侧只增加一个很薄的插件入口层，用来把这些共享内容注册给 Claude Code。

## 安装路径

先克隆仓库：

```bash
git clone {{REPOSITORY_URL}} ~/exmachina
cd ~/exmachina
```

如果你当前的 Claude Code 版本支持仓库插件或开发 marketplace，优先让它读取仓库根目录：

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

## 插件入口会接到哪些内容

Claude 插件入口最终会把这些共享产物暴露出去：

- `../commands`
- `../skills`
- `../agents`
- `../hooks`

## 验证

确认以下文件存在：

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `.claude-plugin/INSTALL.md`

然后在 Claude Code 中发起一次复杂任务，例如调试、实现加验证闭环、或代码审查。若入口生效，输出会更偏向：

- 先收边界
- 先拿证据
- 明确区分事实 / 推断 / 假设 / 决策
- 在完成声明前补验证闭环

## 相关入口

- 根插件 manifest：`.claude-plugin/plugin.json`
- 根开发 marketplace：`.claude-plugin/marketplace.json`
- 根安装文档：`.claude-plugin/INSTALL.md`
