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

## 目录结构

```
exmachina/trae/
├── rules/
│   ├── project_rules.md    # 项目规则
│   └── user_rules.md       # 用户规则
└── skills/
    └── exmachina/
        ├── SKILL.md        # Skill 定义
        └── references/     # 协议与角色参考
            ├── protocol/   # 共享协议
            └── agents/     # 智能体定义
```

## 验证安装

运行构建脚本生成最新产物：

```bash
npm run generate
```

## 更多信息

详见主 README 和 ExMachina 核心文档。