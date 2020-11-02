# resources:
* https://www.docker.com/blog/how-to-deploy-on-remote-docker-hosts-with-docker-compose/
* https://blog.logrocket.com/how-to-deploy-deno-applications-to-production/
* https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

# setup (all machines)
https://docs.docker.com/engine/install/ubuntu/

    /bin/bash

    sudo apt-get update

    sudo apt-get install \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg-agent \
      software-properties-common

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

    sudo add-apt-repository \
      "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) \
      stable"

    sudo apt-get update

    sudo apt-get install docker-ce docker-ce-cli containerd.io

    # https://docs.docker.com/engine/install/linux-postinstall/
    sudo usermod -aG docker $USER

    sudo systemctl enable docker

# local setup
// install docker (depends on platform)

    ssh-keygen

    # linux: 
    ssh-copy-id glen@dev.glenmurphy.com

    # windows:
    type $env:USERPROFILE\.ssh\id_rsa.pub | ssh {IP-ADDRESS-OR-FQDN} "cat >> .ssh/authorized_keys"

# project

### ./Dockerfile:
This is the file that configures how your image is built

    FROM hayd/deno:latest  
    EXPOSE 8000
    WORKDIR /app
    ADD . /app
    RUN deno bundle winwing.mjs winwing.bundle.mjs
    CMD ["run", "--allow-net", "winwing.bundle.mjs"]

### configure context (remote server):
This lets you have all the consequences of your docker commands execute on a remote server (it also
has to run docker, and you need working key auth to it)

    docker context create avocado --docker host=ssh://glen@dev.glenmurphy.com
    docker context use avocado

## build + deploy:
This will build the image, and run it

    docker build . --tag monmon_img
    docker run -d --name monmon --restart always monmon_img

### update:

    docker build . --tag monmon_img 
    docker rm --force monmon
    docker run -d --name monmon --restart always monmon_img
    docker image prune -f

## build + deploy with docker-compose
Docker compose lets you run multiple images together, but also provides a convenient way of
describing the configuration of a single image

### ./docker-compose.yml:

    version: '3'
    services:
      web:
        restart: always 
        build: .
        container_name: monmon
        ports:
          - "8000:8000"

### run:

    docker-compose up -d

### update/rebuild:

    docker-compose build
    docker-compose up -d


# Miscellaneous notes

* docker ps -a to see your images
* sometimes the remote context thing has weird errors - set MaxSessions 500 in sshd_config on the server to fix
* [volumes](https://thenewstack.io/docker-basics-how-to-share-data-between-a-docker-container-and-host/)