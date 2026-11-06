#!/usr/bin/env bash
# One command: make sure Node exists, then start the drag & drop launcher.
cd "$(dirname "$0")"
bash scripts/setup.sh || exit 1
[ -f scripts/.node-path.sh ] && . scripts/.node-path.sh
exec node launcher/server.mjs
