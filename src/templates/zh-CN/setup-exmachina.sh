#!/usr/bin/env bash
set -euo pipefail

repo_root=""
codex_home="${CODEX_HOME:-$HOME/.codex}"
force="false"

usage() {
  cat <<'EOF'
Usage: setup-exmachina.sh [--repo-root PATH] [--codex-home PATH] [--force]

Installs ExMachina into the local Codex skill library by linking:
  <codex-home>/skills/exmachina -> <repo-root>/exmachina/skills
EOF
}

resolve_repo_root() {
  local script_dir="$1"
  local candidate

  for candidate in "$script_dir/.." "$script_dir/../.."; do
    if [ -d "$candidate/exmachina/skills" ]; then
      (cd "$candidate" && pwd)
      return 0
    fi
  done

  return 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo-root)
      repo_root="$2"
      shift 2
      ;;
    --codex-home)
      codex_home="$2"
      shift 2
      ;;
    --force)
      force="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ExMachina] unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -z "$repo_root" ]; then
  repo_root="$(resolve_repo_root "$script_dir")" || {
    echo "[ExMachina] cannot locate repository root from $script_dir" >&2
    exit 1
  }
fi

skills_source="$repo_root/exmachina/skills"
install_root="$codex_home/skills"
install_path="$install_root/exmachina"

if [ ! -d "$skills_source" ]; then
  echo "[ExMachina] skills directory not found: $skills_source" >&2
  echo "[ExMachina] run npm run generate if you are working from source." >&2
  exit 1
fi

mkdir -p "$install_root"

if [ -e "$install_path" ] || [ -L "$install_path" ]; then
  if [ -L "$install_path" ]; then
    rm "$install_path"
  elif [ "$force" = "true" ]; then
    rm -rf "$install_path"
  else
    echo "[ExMachina] target already exists and is not a symlink: $install_path" >&2
    echo "[ExMachina] remove it manually or rerun with --force if replacement is intended." >&2
    exit 1
  fi
fi

ln -s "$skills_source" "$install_path"

if [ ! -f "$install_path/using-exmachina/SKILL.md" ]; then
  echo "[ExMachina] install verification failed: using-exmachina skill missing after link." >&2
  exit 1
fi

echo "[ExMachina] installed to $install_path"
echo "[ExMachina] restart Codex so it reloads installed skills."
