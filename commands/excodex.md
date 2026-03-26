---
description: "ExMachina 主入口。无参数时进入机械智能总控路由。支持 /excodex 与 /exclaude 别名。"
argument-hint: "[analyze|route|implement|verify|audit|任务描述]"
---

根据参数执行不同路由：

- 无参数或直接跟任务描述：加载 `exmachina-zh` 主 Skill，进入全连结指挥体路由。
- `analyze`：优先进入研究/理性链路，先补上下文、证据和反证。
- `implement`：优先进入实作链路，但不能跳过证据与边界确认。
- `verify`：优先进入校验链路，输出断言、证据和未覆盖项。
- `audit`：优先进入理性/安全/审核链路，寻找冲突、反证和薄弱结论。

执行规则：

1. 先识别参数属于哪条路由。
2. 默认使用中文。
3. 优先加载同一份 `exmachina-zh` 主 Skill，而不是为不同平台维护多套行为描述。
4. 如果平台支持多智能体，则按多层结构分派；否则在当前会话中串行模拟所需角色。
