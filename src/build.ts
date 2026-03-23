declare const require: (name: string) => any;
declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

const fs = require("fs");
const path = require("path");

type PackageMetadata = {
  name: string;
  version: string;
};

type TemplateValues = Record<string, string>;

const rootDir = process.cwd();
const bundleRoot = "exmachina";
const promptRoot = "src/prompt";

function fromRoot(...parts: string[]): string {
  return path.join(rootDir, ...parts);
}

function ensureDir(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
}

function makeWritable(targetPath: string): void {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stat = fs.lstatSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      makeWritable(path.join(targetPath, entry));
    }
    fs.chmodSync(targetPath, 0o777);
    return;
  }

  fs.chmodSync(targetPath, 0o666);
}

function removeDir(relativePath: string): void {
  const targetPath = fromRoot(relativePath);
  if (fs.existsSync(targetPath)) {
    makeWritable(targetPath);
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

function removeDirIfEmpty(relativePath: string): void {
  const targetPath = fromRoot(relativePath);
  if (!fs.existsSync(targetPath)) {
    return;
  }

  if (fs.readdirSync(targetPath).length > 0) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

function withLegacyCleanupWarning(relativePath: string, action: () => void): void {
  try {
    action();
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "";

    if (errorCode === "EPERM") {
      console.warn(`[ExMachina] skipped locked legacy artifact: ${relativePath}`);
      return;
    }

    throw error;
  }
}

function removeFile(relativePath: string): void {
  const targetPath = fromRoot(relativePath);
  if (!fs.existsSync(targetPath)) {
    return;
  }

  makeWritable(targetPath);
  fs.rmSync(targetPath, { force: true, maxRetries: 5, retryDelay: 100 });
}

function writeText(relativePath: string, content: string): void {
  const targetPath = fromRoot(relativePath);
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content, "utf8");
}

function writeJson(relativePath: string, value: unknown): void {
  writeText(relativePath, JSON.stringify(value, null, 2) + "\n");
}

function readText(relativePath: string): string {
  return fs.readFileSync(fromRoot(relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function copyFile(sourceRelativePath: string, targetRelativePath: string): void {
  const targetPath = fromRoot(targetRelativePath);
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(fromRoot(sourceRelativePath), targetPath);
}

function copyDirectory(sourceRelativePath: string, targetRelativePath: string): void {
  const sourcePath = fromRoot(sourceRelativePath);
  const targetPath = fromRoot(targetRelativePath);
  ensureDir(targetPath);

  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const sourceChild = path.join(sourceRelativePath, entry.name);
    const targetChild = path.join(targetRelativePath, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourceChild, targetChild);
    } else {
      copyFile(sourceChild, targetChild);
    }
  }
}

function copyMarkdownFiles(sourceRelativeDir: string, targetRelativeDir: string): void {
  const sourceDir = fromRoot(sourceRelativeDir);
  ensureDir(fromRoot(targetRelativeDir));
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    copyFile(
      path.join(sourceRelativeDir, entry.name),
      path.join(targetRelativeDir, entry.name)
    );
  }
}

function copySingleSourceToTargets(sourceRelativePath: string, targetRelativePaths: string[]): void {
  const content = readText(sourceRelativePath);
  for (const targetRelativePath of targetRelativePaths) {
    writeText(targetRelativePath, content);
  }
}

function writeContentToTargets(content: string, targetRelativePaths: string[]): void {
  for (const targetRelativePath of targetRelativePaths) {
    writeText(targetRelativePath, content);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderTemplate(sourceRelativePath: string, templateValues: TemplateValues): string {
  let content = readText(sourceRelativePath);
  for (const [key, value] of Object.entries(templateValues)) {
    content = content.replace(new RegExp(`{{${escapeRegExp(key)}}}`, "g"), value);
  }
  return content;
}

function normalizeRepositoryUrl(repositoryUrl: string): string {
  const trimmed = repositoryUrl.trim();
  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
  }
  return trimmed.replace(/\.git$/, "");
}

function toRawBaseUrl(repositoryUrl: string, branch: string): string {
  const match = repositoryUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error(`Unsupported repository URL for raw generation: ${repositoryUrl}`);
  }
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${branch}`;
}

const packageMetadata = readJson<PackageMetadata>("package.json");
const repositoryUrl = normalizeRepositoryUrl(
  process.env.EXMACHINA_REPOSITORY_URL ?? "https://github.com/KurohaneKaoruko/Ex-Machina"
);
const branch = process.env.EXMACHINA_BRANCH ?? "main";
const rawBaseUrl = process.env.EXMACHINA_RAW_BASE_URL ?? toRawBaseUrl(repositoryUrl, branch);
const templateValues: TemplateValues = {
  VERSION: packageMetadata.version,
  REPOSITORY_URL: repositoryUrl,
  RAW_BASE_URL: rawBaseUrl,
  BRANCH: branch
};

function buildRootFiles(): void {
  const plugin = JSON.parse(renderTemplate("src/exmachina/plugin.json", templateValues));
  writeJson(`${bundleRoot}/plugin.json`, plugin);
}

function cleanupLegacyArtifactSurface(): void {
  for (const relativePath of [
    "docs/README.codex.md",
    "docs/README.codex.en.md",
    "exmachina/scripts/setup-exmachina.sh",
    "exmachina/scripts/setup-exmachina.ps1"
  ]) {
    withLegacyCleanupWarning(relativePath, () => removeFile(relativePath));
  }

  for (const relativePath of [
    "skills/exmachina-zh",
    "skills/exmachina-en",
    "skills/using-exmachina",
    "skills/using-exmachina-zh",
    "skills/using-exmachina-en"
  ]) {
    withLegacyCleanupWarning(relativePath, () => removeDir(relativePath));
  }

  for (const relativePath of ["docs", "skills", "exmachina/scripts"]) {
    withLegacyCleanupWarning(relativePath, () => removeDirIfEmpty(relativePath));
  }
}

function buildSkills(): void {
  const zhSkill = renderTemplate("src/templates/zh-CN/exmachina.skill.md", templateValues);
  const enSkill = renderTemplate("src/templates/en-US/exmachina.skill.md", templateValues);
  const usingZhSkill = renderTemplate("src/templates/zh-CN/using-exmachina.skill.md", templateValues);
  const usingEnSkill = renderTemplate("src/templates/en-US/using-exmachina.skill.md", templateValues);

  writeContentToTargets(zhSkill, [
    `${bundleRoot}/skills/exmachina-zh/SKILL.md`,
    `${bundleRoot}/codex/exmachina/SKILL.md`,
    `${bundleRoot}/kiro/skills/exmachina/SKILL.md`,
    `${bundleRoot}/vscode/prompts/exmachina.prompt.md`,
    `${bundleRoot}/vscode/instructions/exmachina.instructions.md`,
    `${bundleRoot}/kiro/steering/exmachina.md`
  ]);

  writeContentToTargets(enSkill, [
    `${bundleRoot}/skills/exmachina-en/SKILL.md`,
    `${bundleRoot}/codex/exmachina-en/SKILL.md`,
    `${bundleRoot}/kiro/skills/exmachina-en/SKILL.md`,
    `${bundleRoot}/vscode/prompts/exmachina.en.prompt.md`,
    `${bundleRoot}/vscode/instructions/exmachina.en.instructions.md`,
    `${bundleRoot}/kiro/steering/exmachina.en.md`
  ]);

  writeContentToTargets(usingZhSkill, [
    `${bundleRoot}/skills/using-exmachina/SKILL.md`,
    `${bundleRoot}/skills/using-exmachina-zh/SKILL.md`
  ]);

  writeContentToTargets(usingEnSkill, [
    `${bundleRoot}/skills/using-exmachina-en/SKILL.md`
  ]);

  for (const targetRoot of [
    `${bundleRoot}/skills/exmachina-zh/references`,
    `${bundleRoot}/codex/exmachina/references`,
    `${bundleRoot}/kiro/skills/exmachina/references`,
    `${bundleRoot}/skills/exmachina-en/references`,
    `${bundleRoot}/codex/exmachina-en/references`,
    `${bundleRoot}/kiro/skills/exmachina-en/references`
  ]) {
    copyDirectory(`${promptRoot}/protocol`, `${targetRoot}/protocol`);
    copyMarkdownFiles(`${promptRoot}/agents`, `${targetRoot}/agents`);
  }
}

function buildCommands(): void {
  const zhCommand = renderTemplate("src/templates/zh-CN/ex.command.md", templateValues);
  const enCommand = renderTemplate("src/templates/en-US/ex.command.md", templateValues);

  writeContentToTargets(zhCommand, [
    `${bundleRoot}/commands/ex.md`,
    `${bundleRoot}/commands/excodex.md`,
    `${bundleRoot}/commands/exclaude.md`
  ]);

  writeContentToTargets(enCommand, [
    `${bundleRoot}/commands/ex.en.md`,
    `${bundleRoot}/commands/excodex.en.md`,
    `${bundleRoot}/commands/exclaude.en.md`
  ]);
}

function buildAgents(): void {
  copyMarkdownFiles(`${promptRoot}/agents`, `${bundleRoot}/agents`);
}

function buildTraeSurface(): void {
  const zhSkill = renderTemplate("src/templates/zh-CN/exmachina.skill.md", templateValues);
  const enSkill = renderTemplate("src/templates/en-US/exmachina.skill.md", templateValues);

  writeContentToTargets(zhSkill, [`${bundleRoot}/trae/skills/exmachina/SKILL.md`]);
  writeContentToTargets(enSkill, [`${bundleRoot}/trae/skills/exmachina-en/SKILL.md`]);

  for (const targetRoot of [
    `${bundleRoot}/trae/skills/exmachina/references`,
    `${bundleRoot}/trae/skills/exmachina-en/references`
  ]) {
    copyDirectory(`${promptRoot}/protocol`, `${targetRoot}/protocol`);
    copyMarkdownFiles(`${promptRoot}/agents`, `${targetRoot}/agents`);
  }
}

function buildClaudePluginSurface(): void {
  writeJson(`${bundleRoot}/claude-plugin/plugin.json`, {
    name: "exmachina",
    version: packageMetadata.version,
    defaultLanguage: "zh-CN",
    entrypoints: {
      commands: "../commands",
      skills: "../skills",
      agents: "../agents",
      hooks: "../hooks"
    }
  });

  writeJson(`${bundleRoot}/claude-plugin/marketplace.json`, {
    name: "exmachina",
    title: "ExMachina",
    summary: "绝对理性的机械智能多智能体系统。",
    install: {
      plugin: "plugin.json"
    },
    aliases: ["/ex", "/excodex", "/exclaude"]
  });
}

function buildCodexSurface(): void {
  const installBodyZh = renderTemplate("src/templates/zh-CN/codex.install.md", templateValues);
  const installBodyEn = renderTemplate("src/templates/en-US/codex.install.md", templateValues);
  const readmeBodyZh = renderTemplate("src/templates/zh-CN/codex.readme.md", templateValues);
  const readmeBodyEn = renderTemplate("src/templates/en-US/codex.readme.md", templateValues);
  const bashInstaller = renderTemplate("src/templates/zh-CN/setup-exmachina.sh", templateValues);
  const powerShellInstaller = renderTemplate("src/templates/zh-CN/setup-exmachina.ps1", templateValues);

  writeText(`scripts/setup-exmachina.sh`, bashInstaller);
  writeText(`scripts/setup-exmachina.ps1`, powerShellInstaller);
  writeText(`${bundleRoot}/codex/INSTALL.md`, installBodyZh);
  writeText(`${bundleRoot}/codex/INSTALL.en.md`, installBodyEn);
  writeText(`${bundleRoot}/codex/README.md`, readmeBodyZh);
  writeText(`${bundleRoot}/codex/README.en.md`, readmeBodyEn);
}

function buildHooks(): void {
  writeJson(`${bundleRoot}/hooks/hooks.json`, {
    onSessionStart: ["./session-restore.sh"],
    beforeResponse: ["./route-guard.sh"],
    onSessionEnd: ["./session-snapshot.sh"]
  });

  writeText(
    `${bundleRoot}/hooks/session-restore.sh`,
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] restore session state if available'"
    ].join("\n")
  );

  writeText(
    `${bundleRoot}/hooks/route-guard.sh`,
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] enforce fact/inference/hypothesis/decision separation'"
    ].join("\n")
  );

  writeText(
    `${bundleRoot}/hooks/session-snapshot.sh`,
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] snapshot residual unknowns and next actions'"
    ].join("\n")
  );
}

function buildEvals(): void {
  writeText(
    `${bundleRoot}/evals/trigger-prompts/should-trigger.txt`,
    [
      "请帮我分析这个报错并修复它。",
      "/ex 追踪这个回归问题，先找证据再动代码。",
      "我们需要一个绝对理性的多智能体调试流程。"
    ].join("\n")
  );

  writeText(
    `${bundleRoot}/evals/trigger-prompts/should-not-trigger.txt`,
    ["简单问候。", "翻译这一句话。", "总结这段我已经给出的文本。"].join("\n")
  );

  writeText(
    `${bundleRoot}/evals/test-helpers.sh`,
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] helper stub for trigger evaluation'"
    ].join("\n")
  );

  writeText(
    `${bundleRoot}/evals/run-trigger-test.sh`,
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] run trigger test against should-trigger.txt and should-not-trigger.txt'"
    ].join("\n")
  );

  writeText(
    `${bundleRoot}/evals/test-behavior.sh`,
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] behavior regression stub'"
    ].join("\n")
  );
}

function buildExamplesAndBenchmark(): void {
  writeJson(`${bundleRoot}/examples/task-brief.json`, {
    goal: "定位并修复一个高风险回归问题",
    acceptanceCriteria: ["找到直接证据", "给出最小修复", "附带验证结果"],
    constraints: ["默认中文输出", "优先可逆动作"],
    excludedScope: ["无关重构", "大规模重写"]
  });

  writeJson(`${bundleRoot}/benchmark/mechanical-intelligence.json`, {
    scenarios: [
      {
        id: "bounded-regression",
        objective: "先证据后修复",
        expected: ["保留未知", "标注证据等级", "输出回退方案"]
      },
      {
        id: "cross-domain-risk",
        objective: "触发全连结指挥体调度",
        expected: ["跨域调度", "冲突裁决", "残余风险说明"]
      }
    ]
  });
}

function buildPromptSurfaces(): void {
  copySingleSourceToTargets("src/prompt/AGENTS.md", [`${bundleRoot}/codex/AGENTS.md`]);

  ensureDir(`${bundleRoot}/trae/rules`);
  const zhRulesBody = readText("src/prompt/RULES.md");
  const enRulesBody = renderTemplate("src/templates/en-US/rules.md", templateValues);
  const traeRuleBodyZh = [
    "---",
    "name: exmachina",
    "description: \"ExMachina 机械智能规则 - 绝对理性、证据驱动\"",
    "---",
    "",
    zhRulesBody
  ].join("\n");
  const traeRuleBodyEn = [
    "---",
    "name: exmachina-en",
    "description: \"ExMachina mechanical-intelligence rules - evidence-bound and auditable\"",
    "---",
    "",
    enRulesBody
  ].join("\n");
  writeText(`${bundleRoot}/trae/rules/project_rules.md`, traeRuleBodyZh);
  writeText(`${bundleRoot}/trae/rules/user_rules.md`, traeRuleBodyZh);
  writeText(`${bundleRoot}/trae/rules/project_rules.en.md`, traeRuleBodyEn);
  writeText(`${bundleRoot}/trae/rules/user_rules.en.md`, traeRuleBodyEn);

  ensureDir(`${bundleRoot}/cursor/rules`);
  const cursorRuleBodyZh = [
    "---",
    "description: ExMachina 机械智能规则",
    "globs:",
    "alwaysApply: true",
    "---",
    "",
    zhRulesBody
  ].join("\n");
  const cursorRuleBodyEn = [
    "---",
    "description: ExMachina mechanical-intelligence rules",
    "globs:",
    "alwaysApply: true",
    "---",
    "",
    enRulesBody
  ].join("\n");
  writeText(`${bundleRoot}/cursor/rules/exmachina.mdc`, cursorRuleBodyZh);
  writeText(`${bundleRoot}/cursor/rules/exmachina-en.mdc`, cursorRuleBodyEn);

  writeText(`${bundleRoot}/kiro/steering/exmachina.md`, zhRulesBody);
  writeText(`${bundleRoot}/kiro/steering/exmachina.en.md`, enRulesBody);
}

function buildMiscSurfaces(): void {
  writeText(
    `${bundleRoot}/paper/机械智能说明.md`,
    "# 机械智能说明\n\nExMachina 以绝对理性、证据分级、冲突裁决、最小可逆执行为核心。\n"
  );

  writeText(
    `${bundleRoot}/trae/INSTALL.md`,
    [
      "# Trae 安装指南",
      "",
      "## 概述",
      "",
      "ExMachina 支持 Trae IDE。本指南说明如何在 Trae 中配置和使用 ExMachina 机械智能系统。",
      "",
      "## 安装方式",
      "",
      "### 方式一：项目规则（推荐）",
      "",
      "1. 从 `exmachina/trae/rules/project_rules.md` 复制内容",
      "2. 在 Trae 中打开设置 → Rules",
      "3. 选择或创建项目规则文件",
      "4. 粘贴内容并保存",
      "",
      "### 方式二：用户规则",
      "",
      "1. 从 `exmachina/trae/rules/user_rules.md` 复制内容",
      "2. 在 Trae 中打开设置 → Rules",
      "3. 选择用户规则文件",
      "4. 粘贴内容并保存",
      "",
      "### 方式三：Skill 配置",
      "",
      "1. 确保项目中有 `exmachina/trae/skills/exmachina/SKILL.md`",
      "2. 在 Trae 中打开设置 → Skills",
      "3. 添加新的 Skill，指向该文件",
      "",
      "## 目录结构",
      "",
      "```",
      "exmachina/trae/",
      "├── rules/",
      "│   ├── project_rules.md    # 项目规则",
      "│   └── user_rules.md       # 用户规则",
      "└── skills/",
      "    └── exmachina/",
      "        ├── SKILL.md        # Skill 定义",
      "        └── references/     # 协议与角色参考",
      "            ├── protocol/   # 共享协议",
      "            └── agents/     # 智能体定义",
      "```",
      "",
      "## 验证安装",
      "",
      "运行构建脚本生成最新产物：",
      "",
      "```bash",
      "npm run generate",
      "```",
      "",
      "## 更多信息",
      "",
      "详见主 README 和 ExMachina 核心文档。"
    ].join("\n")
  );

  writeText(
    `${bundleRoot}/trae/INSTALL.en.md`,
    renderTemplate("src/templates/en-US/trae.install.md", templateValues)
  );
}

function main(): void {
  cleanupLegacyArtifactSurface();
  buildRootFiles();
  buildSkills();
  buildCommands();
  buildAgents();
  buildPromptSurfaces();
  buildTraeSurface();
  buildClaudePluginSurface();
  buildCodexSurface();
  buildHooks();
  buildEvals();
  buildExamplesAndBenchmark();
  buildMiscSurfaces();
  console.log("ExMachina bundle generated.");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
