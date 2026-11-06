#!/usr/bin/env bash
# Ensures Node.js >= 20 is available (installs it if not), without admin rights when possible.
set -euo pipefail
NEED=20
have_node() { command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge "$NEED" ]; }

if have_node; then echo "✓ Node $(node -v) found"; exit 0; fi
echo "Node.js >= $NEED not found — installing…"

if [ "$(uname -s)" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
  brew install node@22 && brew link --overwrite --force node@22 || true
fi

if ! have_node; then
  # fnm: user-space installer, works on Linux/macOS without sudo
  FNM_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"
  if [ ! -x "$FNM_DIR/fnm" ]; then
    command -v curl >/dev/null 2>&1 || { echo "curl is required to install Node.js"; exit 1; }
    curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "$FNM_DIR" --skip-shell
  fi
  export PATH="$FNM_DIR:$PATH"
  eval "$(fnm env --shell bash)"
  fnm install 22
  NODE_BIN="$(dirname "$(fnm exec --using=22 which node)")"
  echo "export PATH=\"$NODE_BIN:\$PATH\"" > "$(dirname "$0")/.node-path.sh"
  export PATH="$NODE_BIN:$PATH"
fi

if have_node; then echo "✓ Node $(node -v) ready"; else echo "✗ Could not install Node.js automatically — see https://nodejs.org"; exit 1; fi
