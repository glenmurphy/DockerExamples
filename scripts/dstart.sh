#!/bin/bash
# Usage: dstart.sh myscript.js
#
# Packages a Deno script into an image and runs it in the background, restarting
# it if it crashes or the machine reboots. Run it again after editing the script
# to rebuild and replace the container; dstop.sh stops it. Everything in the
# script's directory is copied into the image (add a .dockerignore to leave
# things out), and the script only gets network access (--allow-net).
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 script.js" >&2
  exit 1
fi

script="$(basename "$1")"
dir="$(dirname "$1")"
# image names have to be lowercase
name="$(echo "$script" | tr '[:upper:]' '[:lower:]')"

docker build --label dstart --tag "${name}_img" --file - "$dir" <<EOF
FROM denoland/deno:2.9.7
WORKDIR /app
COPY . .
RUN deno cache "$script"
USER deno
CMD ["run", "--allow-net", "$script"]
EOF

# only replace the running container once the new image has built successfully
docker rm --force "${name}_con" > /dev/null 2>&1 || true
docker run -d --name "${name}_con" --restart unless-stopped "${name}_img"

# delete the image the old container was using (only images built by this script)
docker image prune --force --filter label=dstart > /dev/null
