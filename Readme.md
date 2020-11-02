My naive notes and base examples on how to set up and use Docker. My early experience has been that Docker makes deployment, maintenance, and management of even the simplest services across machines (e.g. dev and prod) orders of magnitude easier, at the expense of having to learn a few new commands up-front.

# Mental Model
Docker lets you very easily build *images* (think of them as a file containing a virtual
machine) that you then run in *containers* (the running virtual machine). It manages the running
state of that virtual machine for you - restarting it across system restarts etc. A key value is that docker is consistent across different host operating systems, so not only does it make deployment easier, it makes it consistent.

- This means you can easily run your scripts (Deno) in a persistent way without worrying about how to set up Deno or Node with systemd etc. As an example, the [dstart](https://github.com/glenmurphy/DockerExamples/blob/master/scripts/dstart.sh) script shows how you can package and run any Deno script persistently using "dstart scriptname.js"
- Using Docker Compose, you can group images together so you can have one container running an nginx image, a Deno app server image, and a database image
- Using Docker Contexts, you can have the results of your commands execute on the local machine, staging, or prod - this lets you build, run, and manage things using the same set of commands on different devices
- It lets you configure how containers talk to each other, so one key example is having an nginx+letsencrypt container that notices the creation of other webserver containers and automatically starts accepting requests for their domain, creates SSL certs, proxies requests etc. This greatly simplifies the deployment of websites (no messing around with systemd, nginx conf, and letencrypt)

### How I use it
- I use [dstart](https://github.com/glenmurphy/DockerExamples/blob/master/scripts/dstart.sh) on my development server to run my deno scripts (monitoring stuff) persistently. Another example might be a simple [appserver](https://github.com/glenmurphy/DockerExamples/tree/master/appserver)
- I use [nginx-proxy](https://github.com/glenmurphy/DockerExamples/tree/master/nginx) on my prod server, and deploy servers behind it so they get SSL and domains set up (see [webserver](https://github.com/glenmurphy/DockerExamples/tree/master/webserver), and [socketserver](https://github.com/glenmurphy/DockerExamples/tree/master/socketserver))


# Quick example

This walks you through taking a Deno script (myscript.js) and running it in a persistent way.

1. In the same directory as your script, create a file named 'Dockerfile' (case matters) containing:

        FROM hayd/deno:latest  
        EXPOSE 8000
        WORKDIR /app
        ADD . /app
        RUN deno cache myscript.js
        CMD ["run", "--allow-net", "myscript.js"]

2. Build the image

        docker build . --tag myscript_img

3. Run the image

        docker run -d --restart always myscript_img

You're done! If you have docker set up to run on system startup ("systemctl enable docker" on most Linux distros), then your script will run always.

# Setup (installing docker)
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

# Project config

### Dockerfile:
This is the file that configures how your image is built. Here's an example showing a Deno setup that uses Deno bundle to package all the scripts so it doesn't need to fetch them at runtime (this can be a bit flaky so you can also drop it). You need to put this in a file named 'Dockerfile' (case sensitive) in the same directory as your code:

    FROM hayd/deno:latest  
    EXPOSE 8000
    WORKDIR /app
    ADD . /app
    RUN deno bundle winwing.mjs winwing.bundle.mjs
    CMD ["run", "--allow-net", "winwing.bundle.mjs"]

### Context (remote server):
This lets you have all the consequences of your docker commands execute on a remote server (it also
has to run docker.

1. Set up key-based auth on the local machine:

        ssh-keygen

        # linux: 
        ssh-copy-id glen@[YOUR_SERVER_HOSTNAME]

        # windows:
        type $env:USERPROFILE\.ssh\id_rsa.pub | ssh [YOUR_SERVER_HOSTNAME] "cat >> .ssh/authorized_keys"

2. Create a docker context for your production server (which must have Docker installed, and should have MaxSessions 500 in sshd_config)

        docker context create prod --docker host=ssh://glen@[YOUR_SERVER_HOSTNAME]
        docker context use prod

## Build + deploy:
This will build the image, and run it on the context

    docker build . --tag monmon_img
    docker run -d --name monmon --restart always monmon_img

### Update:

    docker build . --tag monmon_img 
    docker rm --force monmon
    docker run -d --name monmon --restart always monmon_img
    docker image prune -f

## Build + deploy with docker-compose
Docker compose lets you run multiple images together in one container, and also provides a convenient way of describing additional container configuration without having to use command line arguments

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