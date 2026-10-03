#!/bin/bash
# Usage: dstop.sh myscript.js
#
# Stops a script started with dstart.sh and removes its container, so it stays
# stopped after a reboot. Run dstart.sh again to bring it back.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 script.js" >&2
  exit 1
fi

name="$(basename "$1" | tr '[:upper:]' '[:lower:]')"
docker rm --force "${name}_con"
