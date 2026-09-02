import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function stripFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return content;
  }
  return match[2];
}

function normalizePath(input, homeDir) {
  if (!input || typeof input !== "string") {
    return null;
  }
  let value = input.trim();
  if (!value) {
    return null;
  }
  if (value === "~") {
    return homeDir;
  }
  if (value.startsWith("~/")) {
    value = path.join(homeDir, value.slice(2));
  }
  return path.resolve(value);
}

function resolveBootstrapName() {
  const forced = `${process.env.EXMACHINA_LANG ?? process.env.EXMACHINA_LANGUAGE ?? ""}`.toLowerCase();
  if (forced.startsWith("zh")) {
    return "using-exmachina-zh";
  }
  if (forced.startsWith("en")) {
    return "using-exmachina-en";
  }
  const locale = `${process.env.LANG ?? process.env.LC_ALL ?? ""}`.toLowerCase();
  return locale.startsWith("zh") ? "using-exmachina-zh" : "using-exmachina-en";
}

function getBootstrapContent(skillsDir, configDir) {
  const bootstrapName = resolveBootstrapName();
  const skillPath = path.join(skillsDir, bootstrapName, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    return null;
  }
  const content = stripFrontmatter(fs.readFileSync(skillPath, "utf8"));
  const toolMapping = [
    "Tool mapping for OpenCode:",
    "- Use OpenCode native shell, file, search, and edit tools when names differ.",
    "- Treat the injected ExMachina bootstrap as already loaded; do not reload it redundantly.",
    `- ExMachina shared skills are registered from ${skillsDir}.`,
    configDir ? `- OpenCode config directory resolved to ${configDir}.` : ""
  ].filter(Boolean).join("\n");
  return [
    "You have ExMachina.",
    "IMPORTANT: the selected using-exmachina bootstrap is already injected below. Do not reload it redundantly.",
    content.trim(),
    toolMapping
  ].join("\n\n");
}

export const ExMachinaPlugin = async () => {
  const homeDir = os.homedir();
  const skillsDir = path.resolve(__dirname, "../../skills");
  const configDir = normalizePath(process.env.OPENCODE_CONFIG_DIR ?? "", homeDir) ?? path.join(homeDir, ".config/opencode");

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },
    "experimental.chat.system.transform": async (_input, output) => {
      const bootstrap = getBootstrapContent(skillsDir, configDir);
      if (!bootstrap) {
        return;
      }
      output.system = output.system || [];
      output.system.push(bootstrap);
    }
  };
};
