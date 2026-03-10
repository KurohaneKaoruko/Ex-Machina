#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOT_INSTALL_DIR = path.join(ROOT, "install");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const text = raw.replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

function ensureExists(packRoot, relPath, errors) {
  const full = path.join(packRoot, relPath);
  if (!fs.existsSync(full)) {
    errors.push(`Missing: ${relPath}`);
  }
}

function ensureRootExists(relPath, errors) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    errors.push(`Missing: ${relPath}`);
  }
}

function ensureManifestPath(packRoot, relPath, errors) {
  if (relPath === "install" || relPath.startsWith("install/")) {
    ensureRootExists(relPath, errors);
    return;
  }
  ensureExists(packRoot, relPath, errors);
}

function collectRationalityPaths(packRoot, manifest, errors) {
  const pathsObj = manifest?.rationality_protocol?.paths || {};
  Object.values(pathsObj).forEach((rel) => {
    if (typeof rel === "string") ensureExists(packRoot, rel, errors);
  });
}

function collectManifestPaths(packRoot, manifest, errors) {
  const pathsObj = manifest?.paths || {};
  Object.values(pathsObj).forEach((rel) => {
    if (typeof rel === "string") ensureManifestPath(packRoot, rel, errors);
  });
}

function resolvePackOptions(args) {
  const packIndex = args.indexOf("--pack");
  const langIndex = args.indexOf("--lang");
  const packArg = packIndex >= 0 ? args[packIndex + 1] : "";
  const langArg = langIndex >= 0 ? args[langIndex + 1] : "";

  let packName = packArg || "exmachina";
  let langSuffix = "";

  if (langArg) {
    if (langArg === "en" || langArg === "en-US" || langArg === "en_US") {
      langSuffix = ".en";
      if (!packArg) packName = "exmachina-en";
    }
  }

  if (!langSuffix && packName.endsWith("-en")) {
    langSuffix = ".en";
  }

  return { packName, langSuffix };
}

function checkPack(packName, langSuffix) {
  const packRoot = path.join(ROOT, packName);
  const errors = [];
  if (!fs.existsSync(packRoot)) {
    fail(`Missing pack directory: ${packRoot}`);
  }

  ensureExists(packRoot, "manifest.json", errors);
  ensureExists(packRoot, "openclaw.settings.json", errors);
  ensureExists(packRoot, "openclaw.settings.lite.json", errors);
  ensureExists(packRoot, "BOOTSTRAP.md", errors);
  ensureExists(packRoot, "QUICKSTART.md", errors);
  const conductorFile = packName.endsWith("-en")
    ? "agents/00_primary-conductor.md"
    : "agents/00_全连结指挥体.md";
  ensureExists(packRoot, conductorFile, errors);
  ensureRootExists(`install/INTAKE${langSuffix}.md`, errors);
  ensureRootExists(`install/SETTINGS${langSuffix}.md`, errors);
  ensureRootExists(`install/BOOTSTRAP${langSuffix}.md`, errors);
  ensureRootExists(`install/AGENTS${langSuffix}.md`, errors);
  ensureRootExists(`install/intake.template${langSuffix}.json`, errors);
  ensureRootExists(`PROMPT${langSuffix}.md`, errors);

  const manifestPath = path.join(packRoot, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = readJson(manifestPath);
    collectRationalityPaths(packRoot, manifest, errors);
    collectManifestPaths(packRoot, manifest, errors);
  }

  const requiredDirs = [
    "protocols",
    "agents",
    "runtime"
  ];
  requiredDirs.forEach((rel) => {
    const full = path.join(packRoot, rel);
    if (!fs.existsSync(full)) {
      errors.push(`Missing: ${rel}/`);
      return;
    }
    const entries = fs.readdirSync(full);
    if (!entries.length) {
      errors.push(`Empty directory: ${rel}/`);
    }
  });

  if (errors.length) {
    console.error("Pack check failed:");
    errors.forEach((err) => console.error(`- ${err}`));
    process.exit(1);
  }

  console.log("Pack check ok.");
}

function exportPack(packName, langSuffix, outDir) {
  if (!outDir) fail("Missing --out <dir>");
  const target = path.resolve(outDir);
  const packRoot = path.join(ROOT, packName);
  if (!fs.existsSync(packRoot)) {
    fail(`Missing pack directory: ${packRoot}`);
  }
  fs.mkdirSync(target, { recursive: true });
  const dest = path.join(target, packName);
  fs.cpSync(packRoot, dest, { recursive: true });
  if (fs.existsSync(ROOT_INSTALL_DIR)) {
    fs.cpSync(ROOT_INSTALL_DIR, path.join(target, "install"), {
      recursive: true
    });
  }
  const promptPath = path.join(ROOT, `PROMPT${langSuffix}.md`);
  if (fs.existsSync(promptPath)) {
    fs.copyFileSync(promptPath, path.join(target, `PROMPT${langSuffix}.md`));
  }
  const installScripts = ["install.sh", "install.ps1", "install.cmd"];
  installScripts.forEach((name) => {
    const scriptPath = path.join(ROOT, name);
    if (fs.existsSync(scriptPath)) {
      fs.copyFileSync(scriptPath, path.join(target, name));
    }
  });
  console.log(`Exported to: ${dest}`);
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === "-h" || cmd === "--help") {
    console.log("Usage:");
    console.log("  node src/pack.js check [--pack exmachina|exmachina-en] [--lang zh|en]");
    console.log("  node src/pack.js export --out <dir> [--pack exmachina|exmachina-en] [--lang zh|en]");
    process.exit(0);
  }
  const { packName, langSuffix } = resolvePackOptions(args);
  if (cmd === "check") {
    checkPack(packName, langSuffix);
    return;
  }
  if (cmd === "export") {
    const outIndex = args.indexOf("--out");
    const outDir = outIndex >= 0 ? args[outIndex + 1] : "";
    exportPack(packName, langSuffix, outDir);
    return;
  }
  fail(`Unknown command: ${cmd}`);
}

main();
