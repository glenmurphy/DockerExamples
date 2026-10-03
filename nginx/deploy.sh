#!/bin/bash
# Starts nginx-proxy + acme-companion, or upgrades them after you change the image
# versions in nginx-proxy-compose.yaml. Only recreates containers that changed.
set -euo pipefail
cd "$(dirname "$0")"
docker compose -f nginx-proxy-compose.yaml pull
docker compose -f nginx-proxy-compose.yaml up -d
