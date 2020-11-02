#!/bin/bash
BUNDLE="bundle.$1"
deno bundle --reload $1 $BUNDLE
docker build -t $1_img -f- . <<EOF 
FROM hayd/deno:latest
EXPOSE 8000
WORKDIR /app
COPY $BUNDLE /app/
RUN deno cache $BUNDLE
CMD ["run", "--allow-net", "$BUNDLE"]
EOF
docker rm --force $1_con
docker run -d --name $1_con --restart always $1_img
docker image prune -f
rm $BUNDLE