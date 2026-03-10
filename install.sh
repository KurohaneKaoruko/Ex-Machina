#!/usr/bin/env sh
set -e

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
MODE="full"
TARGET_PATH=""
PACK_DIR="exmachina"
LANG=""
LANG_SUFFIX=""
PACK_OVERRIDE=""

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

echo "ExMachina Prompt-First Install"
echo "1) Read: $INTAKE_FILE"
echo "2) Select mode: $MODE"
echo "3) Import: $SETTINGS_FILE (merge ExMachina agent entries; set exmachina-main as default)"
echo "4) Follow: $BOOTSTRAP_FILE"

echo ""
if [ -z "$TARGET_PATH" ]; then
  echo "Tip: You can copy the settings template into your OpenClaw config path."
  echo "Usage: ./install.sh [--mode lite|full] [--pack exmachina|exmachina-en] [--lang zh|en] <target-config-path>"
  exit 0
fi

TARGET_DIR=$(dirname "$TARGET_PATH")

mkdir -p "$TARGET_DIR"
if [ -f "$TARGET_PATH" ]; then
  BACKUP_PATH="$TARGET_PATH.exmachina.bak"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backup created: $BACKUP_PATH"
fi

cp "$SETTINGS_FILE" "$TARGET_PATH"
echo "Copied settings template to: $TARGET_PATH"
echo "Note: This replaces the target file; merge manually if needed."


