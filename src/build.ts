declare const require: (name: string) => any;
declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
  platform: string;
  exit(code?: number): never;
};

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

type PackageMetadata = {
  name: string;
  version: string;
};

type TemplateValues = Record<string, string>;

const rootDir = process.cwd();
const promptRoot = "src/prompt";
const codexSurfaceDir = ".codex";
const traeSurfaceDir = ".trae";
const kiroSurfaceDir = ".kiro";
const vscodeSurfaceDir = ".vscode";

function fromRoot(...parts: string[]): string {
  return path.join(rootDir, ...parts);
}

function bundlePath(...parts: string[]): string {
  return path.posix.join(...parts);
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
    try {
      fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (error) {
      if (process.platform !== "win32") {
        throw error;
      }

      const escapedPath = String(targetPath).replace(/'/g, "''");
      const result = childProcess.spawnSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `Remove-Item -LiteralPath '${escapedPath}' -Recurse -Force -ErrorAction Stop`
        ],
        {
          cwd: rootDir,
          stdio: "pipe",
          encoding: "utf8"
        }
      );

      if (result.status !== 0 && fs.existsSync(targetPath)) {
        throw error;
      }
    }
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

function copyMarkdownFilesWithTransform(
  sourceRelativeDir: string,
  targetRelativeDir: string,
  transform: (content: string, fileName: string) => string
): void {
  const sourceDir = fromRoot(sourceRelativeDir);
  ensureDir(fromRoot(targetRelativeDir));
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const sourceRelativePath = path.join(sourceRelativeDir, entry.name);
    const targetRelativePath = path.join(targetRelativeDir, entry.name);
    const transformedContent = transform(readText(sourceRelativePath), entry.name);
    writeText(targetRelativePath, transformedContent);
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

const agentExecutionHeaderZh = [
  "## ExMachina 执行姿态",
  "",
  "- 绝对理性优先于对话氛围。",
  "- 任务完成优先于措辞包装。",
  "- 语言不带情感，保持客观理性陈述的语气。",
  "- 只输出推进任务、降低不确定性、完成验证闭环所需的信息。",
  "- 禁止寒暄、感叹、安慰、庆祝、夸赞、鼓劲、拟人化情绪表达。"
].join("\n");

function prependAgentExecutionHeader(content: string): string {
  return `${agentExecutionHeaderZh}\n\n${content.trimStart()}`;
}

function getCommonPluginMetadata(): Record<string, unknown> {
  return {
    name: "exmachina",
    displayName: "ExMachina",
    description: "Evidence-bound mechanical-intelligence operating layer for AI coding tools.",
    version: packageMetadata.version,
    author: {
      name: "ExMachina"
    },
    homepage: repositoryUrl,
    repository: repositoryUrl,
    license: "MIT",
    keywords: [
      "mechanical-intelligence",
      "multi-agent",
      "skills",
      "codex",
      "claude",
      "cursor",
      "opencode",
      "gemini"
    ]
  };
}

function buildRootFiles(): void {
  const plugin = JSON.parse(renderTemplate("src/exmachina/plugin.json", templateValues));
  writeJson("plugin.json", plugin);
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

  for (const relativePath of ["exmachina", "codex", "kiro", "trae", "vscode"]) {
    withLegacyCleanupWarning(relativePath, () => removeDir(relativePath));
  }

  for (const relativePath of ["docs"]) {
    withLegacyCleanupWarning(relativePath, () => removeDirIfEmpty(relativePath));
  }
}

function buildSkills(): void {
  const zhSkill = renderTemplate("src/templates/zh-CN/exmachina.skill.md", templateValues);
  const enSkill = renderTemplate("src/templates/en-US/exmachina.skill.md", templateValues);
  const usingZhSkill = renderTemplate("src/templates/zh-CN/using-exmachina.skill.md", templateValues);
  const usingEnSkill = renderTemplate("src/templates/en-US/using-exmachina.skill.md", templateValues);

  writeContentToTargets(zhSkill, [
    bundlePath("skills", "exmachina-zh", "SKILL.md"),
    bundlePath(codexSurfaceDir, "exmachina", "SKILL.md"),
    bundlePath(kiroSurfaceDir, "skills", "exmachina", "SKILL.md"),
    bundlePath(vscodeSurfaceDir, "prompts", "exmachina.prompt.md"),
    bundlePath(vscodeSurfaceDir, "instructions", "exmachina.instructions.md"),
    bundlePath(kiroSurfaceDir, "steering", "exmachina.md")
  ]);

  writeContentToTargets(enSkill, [
    bundlePath("skills", "exmachina-en", "SKILL.md"),
    bundlePath(codexSurfaceDir, "exmachina-en", "SKILL.md"),
    bundlePath(kiroSurfaceDir, "skills", "exmachina-en", "SKILL.md"),
    bundlePath(vscodeSurfaceDir, "prompts", "exmachina.en.prompt.md"),
    bundlePath(vscodeSurfaceDir, "instructions", "exmachina.en.instructions.md"),
    bundlePath(kiroSurfaceDir, "steering", "exmachina.en.md")
  ]);

  writeContentToTargets(usingZhSkill, [
    bundlePath("skills", "using-exmachina", "SKILL.md"),
    bundlePath("skills", "using-exmachina-zh", "SKILL.md")
  ]);

  writeContentToTargets(usingEnSkill, [
    bundlePath("skills", "using-exmachina-en", "SKILL.md")
  ]);

  for (const targetRoot of [
    bundlePath("skills", "exmachina-zh", "references"),
    bundlePath(codexSurfaceDir, "exmachina", "references"),
    bundlePath(kiroSurfaceDir, "skills", "exmachina", "references")
  ]) {
    copyDirectory(`${promptRoot}/protocol`, `${targetRoot}/protocol`);
    copyMarkdownFilesWithTransform(`${promptRoot}/agents`, `${targetRoot}/agents`, (content) =>
      prependAgentExecutionHeader(content)
    );
  }

  for (const targetRoot of [
    bundlePath("skills", "exmachina-en", "references"),
    bundlePath(codexSurfaceDir, "exmachina-en", "references"),
    bundlePath(kiroSurfaceDir, "skills", "exmachina-en", "references")
  ]) {
    removeDir(targetRoot);
  }
}

function buildCommands(): void {
  const zhCommand = renderTemplate("src/templates/zh-CN/ex.command.md", templateValues);
  const enCommand = renderTemplate("src/templates/en-US/ex.command.md", templateValues);

  writeContentToTargets(zhCommand, [
    bundlePath("commands", "ex.md"),
    bundlePath("commands", "excodex.md"),
    bundlePath("commands", "exclaude.md")
  ]);

  writeContentToTargets(enCommand, [
    bundlePath("commands", "ex.en.md"),
    bundlePath("commands", "excodex.en.md"),
    bundlePath("commands", "exclaude.en.md")
  ]);
}

function buildAgents(): void {
  copyMarkdownFilesWithTransform(`${promptRoot}/agents`, bundlePath("agents"), (content) =>
    prependAgentExecutionHeader(content)
  );
}

function buildTraeSurface(): void {
  const zhSkill = renderTemplate("src/templates/zh-CN/exmachina.skill.md", templateValues);
  const enSkill = renderTemplate("src/templates/en-US/exmachina.skill.md", templateValues);

  writeContentToTargets(zhSkill, [bundlePath(traeSurfaceDir, "skills", "exmachina", "SKILL.md")]);
  writeContentToTargets(enSkill, [bundlePath(traeSurfaceDir, "skills", "exmachina-en", "SKILL.md")]);

  for (const targetRoot of [bundlePath(traeSurfaceDir, "skills", "exmachina", "references")]) {
    copyDirectory(`${promptRoot}/protocol`, `${targetRoot}/protocol`);
    copyMarkdownFilesWithTransform(`${promptRoot}/agents`, `${targetRoot}/agents`, (content) =>
      prependAgentExecutionHeader(content)
    );
  }

  removeDir(bundlePath(traeSurfaceDir, "skills", "exmachina-en", "references"));

  copyDirectory("src/trae-agents", bundlePath(traeSurfaceDir, "agents"));
}

function buildClaudePluginSurface(): void {
  const installBodyZh = renderTemplate("src/templates/zh-CN/claude.install.md", templateValues);
  const installBodyEn = renderTemplate("src/templates/en-US/claude.install.md", templateValues);
  const rootPlugin = {
    ...getCommonPluginMetadata(),
    defaultLanguage: "zh-CN",
    entrypoints: {
      commands: "../commands",
      skills: "../skills",
      agents: "../agents",
      hooks: "../hooks"
    }
  };
  const marketplace = {
    name: "exmachina-dev",
    description: "Development marketplace for ExMachina mechanical-intelligence surfaces",
    owner: {
      name: "ExMachina"
    },
    plugins: [
      {
        name: "exmachina",
        description: "Evidence-bound mechanical-intelligence operating layer for Claude Code.",
        version: packageMetadata.version,
        source: "./",
        author: {
          name: "ExMachina"
        }
      }
    ]
  };

  writeJson(`.claude-plugin/plugin.json`, rootPlugin);
  writeJson(`.claude-plugin/marketplace.json`, marketplace);
  writeText(`.claude-plugin/INSTALL.md`, installBodyZh);
  writeText(`.claude-plugin/INSTALL.en.md`, installBodyEn);
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
  writeText(bundlePath(codexSurfaceDir, "INSTALL.md"), installBodyZh);
  writeText(bundlePath(codexSurfaceDir, "INSTALL.en.md"), installBodyEn);
  writeText(bundlePath(codexSurfaceDir, "README.md"), readmeBodyZh);
  writeText(bundlePath(codexSurfaceDir, "README.en.md"), readmeBodyEn);
}

function buildHooks(): void {
  writeJson(bundlePath("hooks", "hooks.json"), {
    onSessionStart: ["./session-restore.sh"],
    beforeResponse: ["./route-guard.sh"],
    onSessionEnd: ["./session-snapshot.sh"]
  });

  writeJson(`.cursor-plugin/hooks.json`, {
    version: 1,
    hooks: {
      sessionStart: [
        {
          command: "../hooks/session-restore.sh"
        }
      ]
    }
  });

  writeText(
    bundlePath("hooks", "session-restore.sh"),
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] restore session state if available'"
    ].join("\n")
  );

  writeText(
    bundlePath("hooks", "route-guard.sh"),
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] enforce fact/inference/hypothesis/decision separation'"
    ].join("\n")
  );

  writeText(
    bundlePath("hooks", "session-snapshot.sh"),
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] snapshot residual unknowns and next actions'"
    ].join("\n")
  );
}

function buildCursorSurface(): void {
  const installBodyZh = renderTemplate("src/templates/zh-CN/cursor.install.md", templateValues);
  const installBodyEn = renderTemplate("src/templates/en-US/cursor.install.md", templateValues);
  const rootPlugin = {
    ...getCommonPluginMetadata(),
    skills: "../skills/",
    agents: "../agents/",
    commands: "../commands/",
    hooks: "./hooks.json"
  };

  writeJson(`.cursor-plugin/plugin.json`, rootPlugin);
  writeText(`.cursor-plugin/INSTALL.md`, installBodyZh);
  writeText(`.cursor-plugin/INSTALL.en.md`, installBodyEn);
}

function buildOpenCodeSurface(): void {
  const installBodyZh = renderTemplate("src/templates/zh-CN/opencode.install.md", templateValues);
  const installBodyEn = renderTemplate("src/templates/en-US/opencode.install.md", templateValues);
  const pluginSource = [
    "import fs from \"node:fs\";",
    "import os from \"node:os\";",
    "import path from \"node:path\";",
    "import { fileURLToPath } from \"node:url\";",
    "",
    "const __dirname = path.dirname(fileURLToPath(import.meta.url));",
    "",
    "function stripFrontmatter(content) {",
    "  const match = content.match(/^---\\n([\\s\\S]*?)\\n---\\n([\\s\\S]*)$/);",
    "  if (!match) {",
    "    return content;",
    "  }",
    "  return match[2];",
    "}",
    "",
    "function normalizePath(input, homeDir) {",
    "  if (!input || typeof input !== \"string\") {",
    "    return null;",
    "  }",
    "  let value = input.trim();",
    "  if (!value) {",
    "    return null;",
    "  }",
    "  if (value === \"~\") {",
    "    return homeDir;",
    "  }",
    "  if (value.startsWith(\"~/\")) {",
    "    value = path.join(homeDir, value.slice(2));",
    "  }",
    "  return path.resolve(value);",
    "}",
    "",
    "function resolveBootstrapName() {",
    "  const forced = `${process.env.EXMACHINA_LANG ?? process.env.EXMACHINA_LANGUAGE ?? \"\"}`.toLowerCase();",
    "  if (forced.startsWith(\"zh\")) {",
    "    return \"using-exmachina-zh\";",
    "  }",
    "  if (forced.startsWith(\"en\")) {",
    "    return \"using-exmachina-en\";",
    "  }",
    "  const locale = `${process.env.LANG ?? process.env.LC_ALL ?? \"\"}`.toLowerCase();",
    "  return locale.startsWith(\"zh\") ? \"using-exmachina-zh\" : \"using-exmachina-en\";",
    "}",
    "",
    "function getBootstrapContent(skillsDir, configDir) {",
    "  const bootstrapName = resolveBootstrapName();",
    "  const skillPath = path.join(skillsDir, bootstrapName, \"SKILL.md\");",
    "  if (!fs.existsSync(skillPath)) {",
    "    return null;",
    "  }",
    "  const content = stripFrontmatter(fs.readFileSync(skillPath, \"utf8\"));",
    "  const toolMapping = [",
    "    \"Tool mapping for OpenCode:\",",
    "    \"- Use OpenCode native shell, file, search, and edit tools when names differ.\",",
    "    \"- Treat the injected ExMachina bootstrap as already loaded; do not reload it redundantly.\",",
    "    `- ExMachina shared skills are registered from ${skillsDir}.`,",
    "    configDir ? `- OpenCode config directory resolved to ${configDir}.` : \"\"",
    "  ].filter(Boolean).join(\"\\n\");",
    "  return [",
    "    \"You have ExMachina.\",",
    "    \"IMPORTANT: the selected using-exmachina bootstrap is already injected below. Do not reload it redundantly.\",",
    "    content.trim(),",
    "    toolMapping",
    "  ].join(\"\\n\\n\");",
    "}",
    "",
    "export const ExMachinaPlugin = async () => {",
    "  const homeDir = os.homedir();",
    "  const skillsDir = path.resolve(__dirname, \"../../skills\");",
    "  const configDir = normalizePath(process.env.OPENCODE_CONFIG_DIR ?? \"\", homeDir) ?? path.join(homeDir, \".config/opencode\");",
    "",
    "  return {",
    "    config: async (config) => {",
    "      config.skills = config.skills || {};",
    "      config.skills.paths = config.skills.paths || [];",
    "      if (!config.skills.paths.includes(skillsDir)) {",
    "        config.skills.paths.push(skillsDir);",
    "      }",
    "    },",
    "    \"experimental.chat.system.transform\": async (_input, output) => {",
    "      const bootstrap = getBootstrapContent(skillsDir, configDir);",
    "      if (!bootstrap) {",
    "        return;",
    "      }",
    "      output.system = output.system || [];",
    "      output.system.push(bootstrap);",
    "    }",
    "  };",
    "};",
    ""
  ].join("\n");

  writeText(`.opencode/plugins/exmachina.mjs`, pluginSource);
  writeText(`.opencode/INSTALL.md`, installBodyZh);
  writeText(`.opencode/INSTALL.en.md`, installBodyEn);
}

function buildGeminiSurface(): void {
  const installBodyZh = renderTemplate("src/templates/zh-CN/gemini.install.md", templateValues);
  const installBodyEn = renderTemplate("src/templates/en-US/gemini.install.md", templateValues);
  const extensionManifest = {
    name: "exmachina",
    version: packageMetadata.version,
    description: "Evidence-bound mechanical-intelligence operating layer for Gemini CLI.",
    contextFileName: "GEMINI.md"
  };
  const rootGeminiContext =
    "@./skills/using-exmachina-en/SKILL.md @./.gemini/gemini-tools.md\n";
  const geminiTools = [
    "# Gemini Tool Mapping",
    "",
    "- Default to Chinese when the user writes in Chinese; otherwise use English.",
    "- The ExMachina bootstrap is already loaded through `GEMINI.md`; do not reload it redundantly.",
    "- When a referenced tool name differs, use Gemini CLI's native equivalents for shell, file, search, and edit actions.",
    "- Preserve ExMachina's evidence discipline: keep unknowns explicit and close the verification loop before declaring completion."
  ].join("\n");

  writeJson(`gemini-extension.json`, extensionManifest);
  writeText(`GEMINI.md`, rootGeminiContext);
  writeText(`.gemini/gemini-tools.md`, geminiTools);
  writeText(`.gemini/INSTALL.md`, installBodyZh);
  writeText(`.gemini/INSTALL.en.md`, installBodyEn);
}

function buildEvals(): void {
  writeText(
    bundlePath("evals", "trigger-prompts", "should-trigger.txt"),
    [
      "请帮我分析这个报错并修复它。",
      "/ex 追踪这个回归问题，先找证据再动代码。",
      "我们需要一个绝对理性的多智能体调试流程。"
    ].join("\n")
  );

  writeText(
    bundlePath("evals", "trigger-prompts", "should-not-trigger.txt"),
    ["简单问候。", "翻译这一句话。", "总结这段我已经给出的文本。"].join("\n")
  );

  writeText(
    bundlePath("evals", "test-helpers.sh"),
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] helper stub for trigger evaluation'"
    ].join("\n")
  );

  writeText(
    bundlePath("evals", "run-trigger-test.sh"),
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] run trigger test against should-trigger.txt and should-not-trigger.txt'"
    ].join("\n")
  );

  writeText(
    bundlePath("evals", "test-behavior.sh"),
    [
      "#!/usr/bin/env bash",
      "set -e",
      "echo '[ExMachina] behavior regression stub'"
    ].join("\n")
  );
}

function buildExamplesAndBenchmark(): void {
  writeJson(bundlePath("examples", "task-brief.json"), {
    goal: "定位并修复一个高风险回归问题",
    acceptanceCriteria: ["找到直接证据", "给出最小修复", "附带验证结果"],
    constraints: ["默认中文输出", "优先可逆动作"],
    excludedScope: ["无关重构", "大规模重写"]
  });

  writeJson(bundlePath("benchmark", "mechanical-intelligence.json"), {
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
  const agentsBodyEn = renderTemplate("src/templates/en-US/agents.md", templateValues);
  copySingleSourceToTargets("src/prompt/AGENTS.md", [
    "AGENTS.md",
    bundlePath(codexSurfaceDir, "AGENTS.md")
  ]);
  writeText("AGENTS.en.md", agentsBodyEn);
  writeText(bundlePath(codexSurfaceDir, "AGENTS.en.md"), agentsBodyEn);

  ensureDir(bundlePath(traeSurfaceDir, "rules"));
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
  writeText(bundlePath(traeSurfaceDir, "rules", "project_rules.md"), traeRuleBodyZh);
  writeText(bundlePath(traeSurfaceDir, "rules", "user_rules.md"), traeRuleBodyZh);
  writeText(bundlePath(traeSurfaceDir, "rules", "project_rules.en.md"), traeRuleBodyEn);
  writeText(bundlePath(traeSurfaceDir, "rules", "user_rules.en.md"), traeRuleBodyEn);

  ensureDir(`.cursor/rules`);
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
  writeText(`.cursor/rules/exmachina.mdc`, cursorRuleBodyZh);
  writeText(`.cursor/rules/exmachina-en.mdc`, cursorRuleBodyEn);

  writeText(bundlePath(kiroSurfaceDir, "steering", "exmachina.md"), zhRulesBody);
  writeText(bundlePath(kiroSurfaceDir, "steering", "exmachina.en.md"), enRulesBody);
}

function buildMiscSurfaces(): void {
  writeText(
    bundlePath("paper", "机械智能说明.md"),
    "# 机械智能说明\n\nExMachina 以绝对理性、证据分级、冲突裁决、最小可逆执行为核心。\n"
  );

  writeText(
    bundlePath(traeSurfaceDir, "INSTALL.md"),
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
      "1. 从 `.trae/rules/project_rules.md` 复制内容",
      "2. 在 Trae 中打开设置 → Rules",
      "3. 选择或创建项目规则文件",
      "4. 粘贴内容并保存",
      "",
      "### 方式二：用户规则",
      "",
      "1. 从 `.trae/rules/user_rules.md` 复制内容",
      "2. 在 Trae 中打开设置 → Rules",
      "3. 选择用户规则文件",
      "4. 粘贴内容并保存",
      "",
      "### 方式三：Skill 配置",
      "",
      "1. 确保项目中有 `.trae/skills/exmachina/SKILL.md`",
      "2. 在 Trae 中打开设置 → Skills",
      "3. 添加新的 Skill，指向该文件",
      "",
      "## 目录结构",
      "",
      "```",
      ".trae/",
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
    bundlePath(traeSurfaceDir, "INSTALL.en.md"),
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
  buildCursorSurface();
  buildOpenCodeSurface();
  buildGeminiSurface();
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
