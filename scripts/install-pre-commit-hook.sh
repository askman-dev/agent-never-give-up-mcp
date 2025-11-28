#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_PATH="$ROOT_DIR/.git/hooks/pre-commit"

if [ ! -d "$ROOT_DIR/.git/hooks" ]; then
        echo "No .git/hooks directory found. Skipping pre-commit hook installation."
        exit 0
fi

cat > "$HOOK_PATH" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"
node scripts/check-prompts.js
HOOK

chmod +x "$HOOK_PATH"
echo "Installed pre-commit hook to run prompt checks."
