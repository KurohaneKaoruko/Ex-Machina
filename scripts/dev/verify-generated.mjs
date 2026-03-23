import fs from "node:fs";
import path from "node:path";

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

const requiredFiles = [
  "exmachina/codex/INSTALL.md",
  "exmachina/codex/INSTALL.en.md",
  "exmachina/codex/README.md",
  "exmachina/codex/README.en.md",
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

const bashInstaller = readText("scripts/setup-exmachina.sh");
assert(
  bashInstaller.includes("install_root=\"$codex_home/skills\""),
  "[verify-generated] shell installer does not target the Codex skills directory"
);
assert(
  bashInstaller.includes("skills_source=\"$repo_root/exmachina/skills\""),
  "[verify-generated] shell installer does not source skills from exmachina/skills"
);

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
