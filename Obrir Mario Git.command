#!/bin/zsh

set -euo pipefail

REPO_URL="https://github.com/sergisalacosta-art/mario-v"

if [[ -d "/Applications/Google Chrome.app" ]]; then
  open -a "Google Chrome" "$REPO_URL"
else
  open "$REPO_URL"
fi
