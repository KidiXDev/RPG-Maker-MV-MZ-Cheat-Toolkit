#!/usr/bin/env sh
set -eu
node "$(dirname "$0")/uninstall.mjs" "$@"
