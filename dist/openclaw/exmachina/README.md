# ExMachina OpenClaw Pack

ExMachina 多智能体系统的 OpenClaw 协作包。

- 模式：lite / full（默认 full）
- 子代理支持：需要（subagents / sessions_spawn）
- 外部路由要求：不需要

## 目录结构

- `agents/`：智能体提示词文件（从 `src/prompt/agents/` 引用）
- `protocol/`：协议文件（从 `src/prompt/protocol/` 引用）
- `runtime/`：运行时拓扑、任务板与共享上下文
- `workflows/`：工作流定义
- `manifest.json`：包清单与元数据
- `BOOTSTRAP.md`：启动入口
- `openclaw.settings.json`：全量模式设置模板
- `openclaw.settings.lite.json`：轻量模式设置模板

## 快速开始

1. 读取 `BOOTSTRAP.md` 了解启动约束。
2. 读取 `manifest.json` 确认模式与连结体清单。
3. 读取 `protocol/` 下的协议文件。
4. 读取 `agents/00_全连结指挥体.md` 作为主控体入口。
5. 按 `workflows/mission-loop.md` 执行工作流。

## 安装

将 `openclaw.settings.json`（或 `openclaw.settings.lite.json`）合并进 OpenClaw 主配置。

## 约束

- 多智能体汇报必须使用 `[xx体]:xxx` 格式。
- 不要修改 OpenClaw 当前默认模型、provider、API 或其它与 ExMachina agent 无关的配置。
