#!/usr/bin/env bash
set -euo pipefail

repo_root=""
codex_home="${CODEX_HOME:-$HOME/.codex}"
force="false"
mode="install"
guidance_language="zh"
guidance_begin="# >>> ExMachina managed block >>>"
guidance_end="# <<< ExMachina managed block <<<"

usage() {
  cat <<'EOF'
Usage: setup-exmachina.sh [--repo-root PATH] [--codex-home PATH] [--force] [--guidance-language zh|en] [--verify|--uninstall|--install-guidance|--remove-guidance]

Default mode installs ExMachina into Codex by:
  <codex-home>/skills/exmachina -> <repo-root>/skills
  syncing numbered agent files from <repo-root>/agents into <codex-home>/agents

Additional modes:
  --verify            Validate that ExMachina skills and managed agents are present
  --uninstall         Remove the ExMachina skills link plus managed agents
  --install-guidance  Install or update a managed ExMachina block in <codex-home>/AGENTS.md
  --remove-guidance   Remove the managed ExMachina block from <codex-home>/AGENTS.md
EOF
}

resolve_repo_root() {
  local script_dir="$1"
  local candidate

  for candidate in "$script_dir/.." "$script_dir/../.."; do
    if [ -d "$candidate/skills" ] && [ -d "$candidate/agents" ]; then
      (cd "$candidate" && pwd)
      return 0
    fi
  done

  return 1
}

is_installable_agent_name() {
  case "$1" in
    [0-9][0-9]_*.md)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

looks_like_exmachina_agent() {
  local target_path="$1"
  [ -f "$target_path" ] || return 1
  grep -q "ExMachina" "$target_path" 2>/dev/null
}

remove_install_target() {
  local target_path="$1"

  if [ -L "$target_path" ] || [ -f "$target_path" ]; then
    rm -f "$target_path"
    return 0
  fi

  if [ -d "$target_path" ]; then
    rm -rf "$target_path"
  fi
}

require_sources() {
  if [ ! -d "$skills_source" ]; then
    echo "[ExMachina] skills directory not found: $skills_source" >&2
    echo "[ExMachina] run npm run generate if you are working from source." >&2
    exit 1
  fi

  if [ ! -d "$agents_source" ]; then
    echo "[ExMachina] agents directory not found: $agents_source" >&2
    echo "[ExMachina] run npm run generate if you are working from source." >&2
    exit 1
  fi
}

list_installable_agent_names() {
  find "$agents_source" -maxdepth 1 -type f -name "*.md" | LC_ALL=C sort | while IFS= read -r source_file; do
    [ -n "$source_file" ] || continue
    agent_name="$(basename "$source_file")"
    if is_installable_agent_name "$agent_name"; then
      printf '%s\n' "$agent_name"
    fi
  done
}

remove_managed_agents() {
  mkdir -p "$agents_root"

  if [ -f "$agent_manifest_path" ]; then
    while IFS= read -r managed_name; do
      [ -n "$managed_name" ] || continue
      remove_install_target "$agents_root/$managed_name"
    done < "$agent_manifest_path"

    rm -f "$agent_manifest_path"
    return 0
  fi

  if [ ! -d "$agents_source" ]; then
    return 0
  fi

  while IFS= read -r managed_name; do
    [ -n "$managed_name" ] || continue
    dest_path="$agents_root/$managed_name"

    if [ "$force" = "true" ] || looks_like_exmachina_agent "$dest_path"; then
      remove_install_target "$dest_path"
    fi
  done < <(list_installable_agent_names)
}

guidance_source_path() {
  case "$guidance_language" in
    zh)
      printf '%s\n' "$repo_root/.codex/AGENTS.md"
      ;;
    en)
      printf '%s\n' "$repo_root/.codex/AGENTS.en.md"
      ;;
    *)
      echo "[ExMachina] unsupported guidance language: $guidance_language" >&2
      exit 1
      ;;
  esac
}

strip_managed_guidance() {
  local source_path="$1"
  local output_path="$2"

  if [ ! -f "$source_path" ]; then
    : > "$output_path"
    return 0
  fi

  awk -v begin="$guidance_begin" -v end="$guidance_end" '
    $0 == begin { skip = 1; next }
    $0 == end { skip = 0; next }
    skip != 1 { print }
  ' "$source_path" > "$output_path"
}

verify_installation() {
  if [ ! -f "$install_path/using-exmachina/SKILL.md" ]; then
    echo "[ExMachina] verification failed: using-exmachina skill missing." >&2
    exit 1
  fi

  if [ ! -f "$agent_manifest_path" ]; then
    echo "[ExMachina] verification failed: agents manifest missing." >&2
    exit 1
  fi

  if ! find "$agents_root" -maxdepth 1 -type f -name "00_*.md" -print -quit | grep -q .; then
    echo "[ExMachina] verification failed: missing coordinator agent (00_*.md)." >&2
    exit 1
  fi

  if ! find "$agents_root" -maxdepth 1 -type f -name "69_*.md" -print -quit | grep -q .; then
    echo "[ExMachina] verification failed: missing coding agent (69_*.md)." >&2
    exit 1
  fi

  while IFS= read -r managed_name; do
    [ -n "$managed_name" ] || continue
    if [ ! -f "$agents_root/$managed_name" ]; then
      echo "[ExMachina] verification failed: managed agent missing: $managed_name" >&2
      exit 1
    fi
  done < "$agent_manifest_path"

  agent_count="$(wc -l < "$agent_manifest_path" | tr -d ' ')"

  echo "[ExMachina] verification ok"
  echo "[ExMachina] skills path: $install_path"
  echo "[ExMachina] agents path: $agents_root"
  echo "[ExMachina] managed agents: $agent_count"
}

install_guidance_mode() {
  mkdir -p "$codex_home"

  local source_path
  source_path="$(guidance_source_path)"
  if [ ! -f "$source_path" ]; then
    echo "[ExMachina] guidance source not found: $source_path" >&2
    exit 1
  fi

  strip_managed_guidance "$guidance_path" "$guidance_clean_path"

  {
    if [ -s "$guidance_clean_path" ]; then
      cat "$guidance_clean_path"
      printf '\n\n'
    fi
    printf '%s\n' "$guidance_begin"
    cat "$source_path"
    printf '\n%s\n' "$guidance_end"
  } > "$guidance_tmp_path"

  mv "$guidance_tmp_path" "$guidance_path"
  rm -f "$guidance_clean_path"
  echo "[ExMachina] installed managed guidance block at: $guidance_path"
}

remove_guidance_mode() {
  if [ ! -f "$guidance_path" ]; then
    echo "[ExMachina] no AGENTS.md guidance file found at: $guidance_path"
    return 0
  fi

  strip_managed_guidance "$guidance_path" "$guidance_clean_path"
  if [ -s "$guidance_clean_path" ]; then
    mv "$guidance_clean_path" "$guidance_path"
  else
    rm -f "$guidance_path" "$guidance_clean_path"
  fi

  echo "[ExMachina] removed managed guidance block from: $guidance_path"
}

install_mode() {
  require_sources
  mkdir -p "$install_root" "$agents_root"

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

  : > "$tmp_manifest_path"

  while IFS= read -r source_file; do
    [ -n "$source_file" ] || continue

    agent_name="$(basename "$source_file")"
    if ! is_installable_agent_name "$agent_name"; then
      continue
    fi

    dest_path="$agents_root/$agent_name"
    printf '%s\n' "$agent_name" >> "$tmp_manifest_path"

    if [ -e "$dest_path" ] || [ -L "$dest_path" ]; then
      can_replace="false"

      if [ -f "$agent_manifest_path" ] && grep -Fxq "$agent_name" "$agent_manifest_path"; then
        can_replace="true"
      elif [ -f "$dest_path" ] && cmp -s "$source_file" "$dest_path"; then
        can_replace="true"
      elif looks_like_exmachina_agent "$dest_path"; then
        can_replace="true"
      elif [ "$force" = "true" ]; then
        can_replace="true"
      fi

      if [ "$can_replace" != "true" ]; then
        rm -f "$tmp_manifest_path"
        echo "[ExMachina] agent target already exists and does not look managed by ExMachina: $dest_path" >&2
        echo "[ExMachina] remove it manually or rerun with --force if replacement is intended." >&2
        exit 1
      fi

      remove_install_target "$dest_path"
    fi

    cp "$source_file" "$dest_path"
  done < <(find "$agents_source" -maxdepth 1 -type f -name "*.md" | LC_ALL=C sort)

  if [ -f "$agent_manifest_path" ]; then
    while IFS= read -r managed_name; do
      [ -n "$managed_name" ] || continue
      if ! grep -Fxq "$managed_name" "$tmp_manifest_path"; then
        remove_install_target "$agents_root/$managed_name"
      fi
    done < "$agent_manifest_path"
  fi

  mv "$tmp_manifest_path" "$agent_manifest_path"

  verify_installation
  echo "[ExMachina] restart Codex so it reloads installed skills and agents."
  echo "[ExMachina] for stronger always-on guidance, run: bash ./scripts/setup-exmachina.sh --install-guidance"
}

uninstall_mode() {
  if [ -e "$install_path" ] || [ -L "$install_path" ]; then
    if [ -L "$install_path" ]; then
      rm "$install_path"
    elif [ "$force" = "true" ]; then
      rm -rf "$install_path"
    else
      echo "[ExMachina] target already exists and is not a symlink: $install_path" >&2
      echo "[ExMachina] rerun with --force only if you intend to remove that directory." >&2
      exit 1
    fi
  fi

  remove_managed_agents
  echo "[ExMachina] removed ExMachina skills link and managed agents."
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
    --guidance-language)
      guidance_language="$2"
      shift 2
      ;;
    --verify)
      mode="verify"
      shift
      ;;
    --uninstall)
      mode="uninstall"
      shift
      ;;
    --install-guidance)
      mode="install-guidance"
      shift
      ;;
    --remove-guidance)
      mode="remove-guidance"
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

skills_source="$repo_root/skills"
agents_source="$repo_root/agents"
install_root="$codex_home/skills"
install_path="$install_root/exmachina"
agents_root="$codex_home/agents"
agent_manifest_path="$agents_root/.exmachina-installed-agents.txt"
tmp_manifest_path="$agents_root/.exmachina-installed-agents.txt.tmp"
guidance_path="$codex_home/AGENTS.md"
guidance_tmp_path="$codex_home/.exmachina-guidance.tmp"
guidance_clean_path="$codex_home/.exmachina-guidance.clean.tmp"

case "$mode" in
  install)
    install_mode
    ;;
  verify)
    verify_installation
    ;;
  uninstall)
    uninstall_mode
    ;;
  install-guidance)
    install_guidance_mode
    ;;
  remove-guidance)
    remove_guidance_mode
    ;;
  *)
    echo "[ExMachina] unsupported mode: $mode" >&2
    exit 1
    ;;
esac
