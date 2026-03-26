# ExMachina for Gemini CLI

ExMachina 现在提供 Gemini CLI 原生 extension 入口：

- 根目录 `gemini-extension.json`
- 根目录 `GEMINI.md`
- 根目录 `.gemini/`

## 安装

直接使用仓库 URL 安装：

```bash
gemini extensions install {{REPOSITORY_URL}}
```

安装后，Gemini CLI 会读取根目录：

- `gemini-extension.json`
- `GEMINI.md`

而 `GEMINI.md` 会继续引用 ExMachina 的共享技能与 Gemini 适配说明。

## 结构说明

Gemini 扩展面不会复制整套提示词逻辑，而是把共享内容复用到一个极薄的入口层：

- `GEMINI.md` 负责装配上下文
- `.gemini/gemini-tools.md` 负责 Gemini 工具映射和语言约定
- `skills/using-exmachina-en/SKILL.md` 负责主引导逻辑

## 验证

确认以下文件存在：

- `gemini-extension.json`
- `GEMINI.md`
- `.gemini/gemini-tools.md`
- `.gemini/INSTALL.md`

然后在 Gemini CLI 中发起一次高风险调试或实现任务。若扩展入口生效，输出会更倾向于：

- 保留未知
- 要求证据闭环
- 在执行前说明风险和验证点

## 相关入口

- 根扩展 manifest：`gemini-extension.json`
- 根上下文文件：`GEMINI.md`
- 根 Gemini 辅助目录：`.gemini/`
