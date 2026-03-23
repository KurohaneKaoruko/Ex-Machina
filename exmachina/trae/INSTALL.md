# Trae 安装指南

## 概述

ExMachina 支持 Trae IDE。本指南说明如何在 Trae 中配置和使用 ExMachina 机械智能系统。

## 安装方式

### 方式一：项目规则（推荐）

1. 从 `exmachina/trae/rules/project_rules.md` 复制内容
2. 在 Trae 中打开设置 → Rules
3. 选择或创建项目规则文件
4. 粘贴内容并保存

### 方式二：用户规则

1. 从 `exmachina/trae/rules/user_rules.md` 复制内容
2. 在 Trae 中打开设置 → Rules
3. 选择用户规则文件
4. 粘贴内容并保存

### 方式三：Skill 配置

1. 确保项目中有 `exmachina/trae/skills/exmachina/SKILL.md`
2. 在 Trae 中打开设置 → Skills
3. 添加新的 Skill，指向该文件

### 方式四：自定义智能体（新）

ExMachina 提供完整的自定义智能体配置，支持层级调用：

1. 查看 `exmachina/trae/agents/` 目录下的 JSON 配置文件
2. 在 Trae 中创建自定义智能体，复制配置内容
3. 详见 [agents/README.md](agents/README.md)

## 目录结构

```
exmachina/trae/
├── rules/
│   ├── project_rules.md    # 项目规则
│   └── user_rules.md       # 用户规则
├── skills/
│   └── exmachina/
│       ├── SKILL.md        # Skill 定义
│       └── references/     # 协议与角色参考
│           ├── protocol/   # 共享协议
│           └── agents/     # 智能体定义
└── agents/                 # 自定义智能体配置（新）
    ├── README.md           # 安装指南
    ├── 00_全连结指挥体.json
    ├── 10_知识连结指挥体.json
    ├── ...
    └── 70_审核体.json
```

## 智能体层级

```
用户 → SOLO Coder → 00_全连结指挥体
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   10-19 连结指挥体  ...  连结指挥体
        ↓               ↓               ↓
   30-70 子个体      ...  子个体
```

## 验证安装

运行构建脚本生成最新产物：

```bash
npm run generate
```

## 快速开始

### 使用规则/Skill

直接在 Trae 对话中开始对话，ExMachina 规则会自动生效。

### 使用自定义智能体

1. 按 [agents/README.md](agents/README.md) 的顺序创建智能体
2. 在对话中输入 `@全连结指挥体` 或其他智能体名称
3. SOLO Coder 会根据任务自动调度子智能体

## 更多信息

详见主 README 和 ExMachina 核心文档。
