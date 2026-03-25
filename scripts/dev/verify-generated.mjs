import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const forbiddenExternalProjectName = ["super", "powers"].join("");

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(relativePath) {
  assert(
    fs.existsSync(path.join(rootDir, relativePath)),
    `[verify-generated] missing required file: ${relativePath}`
  );
}

function assertMissing(relativePath) {
  assert(
    !fs.existsSync(path.join(rootDir, relativePath)),
    `[verify-generated] forbidden legacy artifact still exists: ${relativePath}`
  );
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      [
        `[verify-generated] command failed: ${command} ${args.join(" ")}`,
        `stdout:\n${result.stdout ?? ""}`,
        `stderr:\n${result.stderr ?? ""}`
      ].join("\n")
    );
  }

  return result;
}

function isSpawnBlockedError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /spawnSync .* (EPERM|ENOENT)/.test(error.message);
}

function findMatchingFile(directoryPath, pattern) {
  if (!fs.existsSync(directoryPath)) {
    return "";
  }

  for (const entry of fs.readdirSync(directoryPath)) {
    if (pattern.test(entry)) {
      return path.join(directoryPath, entry);
    }
  }

  return "";
}

const requiredFiles = [
  "AGENTS.md",
  "exmachina/codex/INSTALL.md",
  "exmachina/codex/INSTALL.en.md",
  "exmachina/codex/README.md",
  "exmachina/codex/README.en.md",
  "exmachina/codex/AGENTS.md",
  "scripts/setup-exmachina.sh",
  "scripts/setup-exmachina.ps1",
  "exmachina/skills/using-exmachina/SKILL.md",
  "exmachina/skills/using-exmachina-zh/SKILL.md",
  "exmachina/skills/using-exmachina-en/SKILL.md",
  "exmachina/skills/exmachina-zh/SKILL.md",
  "exmachina/skills/exmachina-en/SKILL.md",
  "exmachina/plugin.json",
  "exmachina/commands/ex.en.md",
  "exmachina/trae/INSTALL.en.md",
  "exmachina/trae/rules/project_rules.en.md"
];

for (const file of requiredFiles) {
  assertFile(file);
}

for (const file of [
  "docs/README.codex.md",
  "docs/README.codex.en.md",
  "skills/exmachina-zh",
  "skills/exmachina-en",
  "skills/using-exmachina",
  "skills/using-exmachina-zh",
  "skills/using-exmachina-en",
  "exmachina/scripts/setup-exmachina.sh",
  "exmachina/scripts/setup-exmachina.ps1"
]) {
  assertMissing(file);
}

const packageJson = readJson("package.json");
const plugin = readJson("exmachina/plugin.json");
assert(
  plugin.version === packageJson.version,
  "[verify-generated] plugin version does not match package.json"
);
assert(
  plugin.homepage === "https://github.com/KurohaneKaoruko/Ex-Machina",
  "[verify-generated] plugin homepage was not rendered"
);
assert(
  Array.isArray(plugin.languages) &&
    plugin.languages.includes("zh-CN") &&
    plugin.languages.includes("en-US"),
  "[verify-generated] plugin languages metadata is incomplete"
);
assert(
  plugin.entrypoints.skill === "skills/using-exmachina-zh/SKILL.md",
  "[verify-generated] plugin skill entrypoint mismatch"
);
assert(
  plugin.entrypoints.skillEnglish === "skills/using-exmachina-en/SKILL.md",
  "[verify-generated] plugin english bootstrap entrypoint mismatch"
);
assert(
  plugin.entrypoints.coreSkillEnglish === "skills/exmachina-en/SKILL.md",
  "[verify-generated] plugin english core skill entrypoint mismatch"
);

const installDoc = readText("exmachina/codex/INSTALL.md");
const installDocEn = readText("exmachina/codex/INSTALL.en.md");
assert(
  installDoc.includes("https://raw.githubusercontent.com/KurohaneKaoruko/Ex-Machina/main/exmachina/codex/INSTALL.md"),
  "[verify-generated] raw install URL missing from install doc"
);
assert(
  installDoc.includes("setup-exmachina.ps1"),
  "[verify-generated] PowerShell install path missing from install doc"
);
assert(
  installDoc.includes("./scripts/setup-exmachina.sh") &&
    installDoc.includes(".\\scripts\\setup-exmachina.ps1"),
  "[verify-generated] install doc does not point to root scripts/"
);
assert(
  installDoc.includes("git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/exmachina") &&
    installDoc.includes("Set-Location \"$HOME/exmachina\""),
  "[verify-generated] install doc still uses the old repository clone path"
);
assert(!installDoc.includes("{{"), "[verify-generated] unresolved template token in install doc");
assert(
  !installDoc.includes(forbiddenExternalProjectName),
  "[verify-generated] install doc contains forbidden external project wording"
);
assert(
  !installDoc.includes("exmachina/scripts"),
  "[verify-generated] install doc still points to exmachina/scripts"
);
assert(
  !installDoc.includes("~/.codex/exmachina-repo") &&
    !installDoc.includes("$HOME/.codex/exmachina-repo"),
  "[verify-generated] install doc still hardcodes the old repository location"
);
assert(
  installDoc.includes("~/.codex/agents/00_全连结指挥体.md") &&
    installDoc.includes(".exmachina-installed-agents.txt"),
  "[verify-generated] install doc does not describe the Codex agents install surface"
);
assert(
  installDocEn.includes("exmachina/codex/INSTALL.en.md"),
  "[verify-generated] english install doc raw URL missing"
);
assert(!installDocEn.includes("{{"), "[verify-generated] unresolved template token in english install doc");
assert(
  !installDocEn.includes(forbiddenExternalProjectName),
  "[verify-generated] english install doc contains forbidden external project wording"
);
assert(
  installDocEn.includes("./scripts/setup-exmachina.sh") &&
    installDocEn.includes(".\\scripts\\setup-exmachina.ps1"),
  "[verify-generated] english install doc does not point to root scripts/"
);
assert(
  installDocEn.includes("git clone https://github.com/KurohaneKaoruko/Ex-Machina ~/exmachina") &&
    installDocEn.includes("Set-Location \"$HOME/exmachina\""),
  "[verify-generated] english install doc still uses the old repository clone path"
);
assert(
  !installDocEn.includes("exmachina/scripts"),
  "[verify-generated] english install doc still points to exmachina/scripts"
);
assert(
  !installDocEn.includes("~/.codex/exmachina-repo") &&
    !installDocEn.includes("$HOME/.codex/exmachina-repo"),
  "[verify-generated] english install doc still hardcodes the old repository location"
);
assert(
  installDocEn.includes("~/.codex/agents/00_全连结指挥体.md") &&
    installDocEn.includes(".exmachina-installed-agents.txt"),
  "[verify-generated] english install doc does not describe the Codex agents install surface"
);

const codexGuide = readText("exmachina/codex/README.md");
const codexGuideEn = readText("exmachina/codex/README.en.md");
assert(
  codexGuide.includes("using-exmachina"),
  "[verify-generated] Codex guide does not mention the bootstrap skill"
);
assert(
  codexGuideEn.includes("using-exmachina-en"),
  "[verify-generated] english Codex guide does not mention the english bootstrap skill"
);
assert(
  !codexGuide.includes(forbiddenExternalProjectName) &&
    !codexGuideEn.includes(forbiddenExternalProjectName),
  "[verify-generated] Codex guides contain forbidden external project wording"
);
assert(
  codexGuide.includes("scripts/setup-exmachina.sh") &&
    codexGuideEn.includes("scripts/setup-exmachina.sh"),
  "[verify-generated] Codex guides do not reference root scripts/"
);
assert(
  codexGuide.includes(".exmachina-installed-agents.txt") &&
    codexGuideEn.includes(".exmachina-installed-agents.txt"),
  "[verify-generated] Codex guides do not mention the managed agents manifest"
);
assert(
  !codexGuide.includes("exmachina/scripts") &&
    !codexGuideEn.includes("exmachina/scripts"),
  "[verify-generated] Codex guides still point to exmachina/scripts"
);

const bootstrapSkill = readText("exmachina/skills/using-exmachina-en/SKILL.md");
assert(
  bootstrapSkill.includes("debugging, implementation, verification"),
  "[verify-generated] english bootstrap skill lost its trigger guidance"
);

const mainSkillEn = readText("exmachina/skills/exmachina-en/SKILL.md");
assert(
  mainSkillEn.includes("Evidence Grades"),
  "[verify-generated] english main skill is missing the full operating sections"
);

const powerShellInstaller = readText("scripts/setup-exmachina.ps1");
assert(
  powerShellInstaller.includes("Join-Path $CodexHome \"skills\""),
  "[verify-generated] PowerShell installer does not target the Codex skills directory"
);
assert(
  powerShellInstaller.includes("Join-Path $RepoRoot \"exmachina\\\\skills\""),
  "[verify-generated] PowerShell installer does not source skills from exmachina/skills"
);
assert(
  powerShellInstaller.includes("Join-Path $CodexHome \"agents\"") &&
    powerShellInstaller.includes("Join-Path $RepoRoot \"exmachina\\\\agents\""),
  "[verify-generated] PowerShell installer does not wire the Codex agents directory"
);
assert(
  powerShellInstaller.includes(".exmachina-installed-agents.txt"),
  "[verify-generated] PowerShell installer does not maintain the agents manifest"
);
assert(
  powerShellInstaller.includes(".exmachina-managed.txt") &&
    powerShellInstaller.includes("Copy-Item -LiteralPath $skillsSource -Destination $installPath -Recurse -Force"),
  "[verify-generated] PowerShell installer does not maintain the managed skills surface"
);

const bashInstaller = readText("scripts/setup-exmachina.sh");
assert(
  bashInstaller.includes("install_root=\"$codex_home/skills\""),
  "[verify-generated] shell installer does not target the Codex skills directory"
);
assert(
  bashInstaller.includes("skills_source=\"$repo_root/exmachina/skills\""),
  "[verify-generated] shell installer does not source skills from exmachina/skills"
);
assert(
  bashInstaller.includes("agents_root=\"$codex_home/agents\"") &&
    bashInstaller.includes("agents_source=\"$repo_root/exmachina/agents\""),
  "[verify-generated] shell installer does not wire the Codex agents directory"
);
assert(
  bashInstaller.includes(".exmachina-installed-agents.txt"),
  "[verify-generated] shell installer does not maintain the agents manifest"
);

assert(
  bashInstaller.includes("--verify") && bashInstaller.includes("--uninstall"),
  "[verify-generated] shell installer is missing lifecycle modes"
);
assert(
  powerShellInstaller.includes("[switch]$Verify") && powerShellInstaller.includes("[switch]$Uninstall"),
  "[verify-generated] PowerShell installer is missing lifecycle modes"
);

function verifyInstallerSmokeTest() {
  const tempRoot = fs.mkdtempSync(path.join(rootDir, ".verify-install-"));
  const codexHome = path.join(tempRoot, ".codex");
  const skillPath = path.join(codexHome, "skills", "exmachina", "using-exmachina", "SKILL.md");
  const agentsDirectory = path.join(codexHome, "agents");
  const manifestPath = path.join(codexHome, "agents", ".exmachina-installed-agents.txt");

  try {
    try {
      if (process.platform === "win32") {
        runCommand("powershell", [
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          ".\\scripts\\setup-exmachina.ps1",
          "-RepoRoot",
          rootDir,
          "-CodexHome",
          codexHome,
          "-Force"
        ]);

        assert(fs.existsSync(skillPath), "[verify-generated] installer smoke test did not install the bootstrap skill");
        assert(
          Boolean(findMatchingFile(agentsDirectory, /^00_.*\.md$/)),
          "[verify-generated] installer smoke test did not sync the coordinator agent"
        );
        assert(fs.existsSync(manifestPath), "[verify-generated] installer smoke test did not create the agents manifest");

        runCommand("powershell", [
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          ".\\scripts\\setup-exmachina.ps1",
          "-RepoRoot",
          rootDir,
          "-CodexHome",
          codexHome,
          "-Verify"
        ]);

        runCommand("powershell", [
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          ".\\scripts\\setup-exmachina.ps1",
          "-RepoRoot",
          rootDir,
          "-CodexHome",
          codexHome,
          "-Uninstall"
        ]);
      } else {
        runCommand("bash", [
          "./scripts/setup-exmachina.sh",
          "--repo-root",
          rootDir,
          "--codex-home",
          codexHome,
          "--force"
        ]);

        assert(fs.existsSync(skillPath), "[verify-generated] installer smoke test did not install the bootstrap skill");
        assert(
          Boolean(findMatchingFile(agentsDirectory, /^00_.*\.md$/)),
          "[verify-generated] installer smoke test did not sync the coordinator agent"
        );
        assert(fs.existsSync(manifestPath), "[verify-generated] installer smoke test did not create the agents manifest");

        runCommand("bash", [
          "./scripts/setup-exmachina.sh",
          "--repo-root",
          rootDir,
          "--codex-home",
          codexHome,
          "--verify"
        ]);

        runCommand("bash", [
          "./scripts/setup-exmachina.sh",
          "--repo-root",
          rootDir,
          "--codex-home",
          codexHome,
          "--uninstall"
        ]);
      }
    } catch (error) {
      if (isSpawnBlockedError(error)) {
        console.warn("[verify-generated] warning: installer smoke test skipped because subprocess launch is blocked in this environment");
        return;
      }

      throw error;
    }

    assert(
      !fs.existsSync(path.join(codexHome, "skills", "exmachina")),
      "[verify-generated] installer smoke test did not remove the skills surface on uninstall"
    );
    assert(
      !findMatchingFile(agentsDirectory, /^00_.*\.md$/),
      "[verify-generated] installer smoke test did not remove managed agents on uninstall"
    );
    assert(
      !fs.existsSync(manifestPath),
      "[verify-generated] installer smoke test did not remove the agents manifest on uninstall"
    );
  } finally {
    try {
      fs.rmSync(tempRoot, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100
      });
    } catch (error) {
      console.warn(
        `[verify-generated] warning: failed to clean temporary install directory: ${tempRoot}`
      );
    }
  }
}

verifyInstallerSmokeTest();

for (const file of ["README.md", "README-en.md"]) {
  assert(
    !readText(file).includes(forbiddenExternalProjectName),
    `[verify-generated] forbidden external project wording remains in ${file}`
  );
  assert(
    !readText(file).includes("~/.codex/exmachina-repo"),
    `[verify-generated] old repository location remains in ${file}`
  );
}

console.log("[verify-generated] ok");
