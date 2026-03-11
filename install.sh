#!/usr/bin/env sh
set -e

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
MODE="full"
TARGET_PATH=""
PACK_DIR="exmachina"
LANG=""
LANG_SUFFIX=""
PACK_OVERRIDE=""
INTAKE_PATH=""
ALLOW_MISSING=""
DRY_RUN=""
NO_BACKUP=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --pack)
      PACK_DIR="$2"
      PACK_OVERRIDE="1"
      shift 2
      ;;
    --lang)
      LANG="$2"
      shift 2
      ;;
    --intake)
      INTAKE_PATH="$2"
      shift 2
      ;;
    --target)
      TARGET_PATH="$2"
      shift 2
      ;;
    --allow-missing)
      ALLOW_MISSING="1"
      shift
      ;;
    --dry-run|--dry|--dryrun)
      DRY_RUN="1"
      shift
      ;;
    --no-backup)
      NO_BACKUP="1"
      shift
      ;;
    lite|full)
      MODE="$1"
      shift
      ;;
    *)
      TARGET_PATH="$1"
      shift
      ;;
  esac
done

if [ -n "$LANG" ]; then
  case "$LANG" in
    en|en-US|en_US)
      LANG_SUFFIX=".en"
      ;;
    *)
      LANG_SUFFIX=""
      ;;
  esac
fi

if [ -n "$LANG" ] && [ -z "$PACK_OVERRIDE" ]; then
  case "$LANG" in
    en|en-US|en_US)
      PACK_DIR="exmachina-en"
      ;;
  esac
fi

if [ -z "$LANG_SUFFIX" ]; then
  case "$PACK_DIR" in
    *-en)
      LANG_SUFFIX=".en"
      ;;
  esac
fi

case "$MODE" in
  lite)
    SETTINGS_FILE="$ROOT_DIR/$PACK_DIR/openclaw.settings.lite.json"
    ;;
  full)
    SETTINGS_FILE="$ROOT_DIR/$PACK_DIR/openclaw.settings.json"
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: ./install.sh [--mode lite|full] [--pack exmachina|exmachina-en] [--lang zh|en] <target-config-path>"
    exit 1
    ;;
esac

if [ ! -f "$SETTINGS_FILE" ]; then
  echo "Missing: $SETTINGS_FILE"
  exit 1
fi

INTAKE_FILE="$ROOT_DIR/install/INTAKE${LANG_SUFFIX}.md"
BOOTSTRAP_FILE="$ROOT_DIR/$PACK_DIR/BOOTSTRAP.md"
APPLY_SCRIPT="$ROOT_DIR/install/apply-openclaw-settings.js"
if [ -z "$INTAKE_PATH" ]; then
  INTAKE_PATH="$ROOT_DIR/install/intake.template${LANG_SUFFIX}.json"
fi

echo "ExMachina Prompt-First Install"
echo "1) Read: $INTAKE_FILE"
echo "2) Select mode: $MODE"
echo "3) Apply: $SETTINGS_FILE via $APPLY_SCRIPT (merge ExMachina agent entries; set exmachina-main as default)"
echo "4) Follow: $BOOTSTRAP_FILE"

echo ""
if [ ! -f "$APPLY_SCRIPT" ]; then
  echo "Missing: $APPLY_SCRIPT"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Please install Node.js or merge settings manually."
  exit 1
fi

EXTRA_ARGS=""
if [ -n "$ALLOW_MISSING" ]; then
  EXTRA_ARGS="$EXTRA_ARGS --allow-missing"
fi
if [ -n "$DRY_RUN" ]; then
  EXTRA_ARGS="$EXTRA_ARGS --dry-run"
fi
if [ -n "$NO_BACKUP" ]; then
  EXTRA_ARGS="$EXTRA_ARGS --no-backup"
fi

if [ -z "$TARGET_PATH" ]; then
  echo "Note: No target path provided; using target_config_path from $INTAKE_PATH."
  echo "Usage: ./install.sh [--mode lite|full] [--pack exmachina|exmachina-en] [--lang zh|en] [--intake <path>] [--target <path>]"
fi

TARGET_ARG=""
if [ -n "$TARGET_PATH" ]; then
  TARGET_ARG="--target $TARGET_PATH"
fi

node "$APPLY_SCRIPT" --mode "$MODE" --pack "$PACK_DIR" --lang "$LANG" --intake "$INTAKE_PATH" $TARGET_ARG $EXTRA_ARGS


