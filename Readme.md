My notes and base examples on how to set up and use Docker. My experience has been that Docker makes deployment, maintenance, and management of even the simplest services across machines (e.g. dev and prod) orders of magnitude easier, at the expense of having to learn a few new commands up-front.

# Mental Model
Docker lets you very easily build *images* (think of them as a snapshot of the files of a small Linux install - your app and everything it needs - plus the command that starts it) that you then run as *containers* (a running copy of an image). A container isn't a virtual machine: it's your program running as an isolated process on the host's kernel, with its own filesystem, network, and process list, so it starts quickly and has very little overhead (on Mac and Windows, Docker runs a Linux VM to host them). Docker manages the running state of your containers for you - restarting them across system restarts etc. A key value is that docker is consistent across different machines, so not only does it make deployment easier, it makes it consistent.

- This means you can easily run your scripts (Deno) in a persistent way without worrying about how to set up Deno or Node with systemd etc. As an example, the [dstart](scripts/dstart.sh) script shows how you can package and run any Deno script persistently using "dstart scriptname.js"
- Using Docker Compose, you can describe a group of containers in one file - e.g. an nginx container, a Deno app server container, and a database container - and start, stop, and update them together
- Using Docker Contexts, you can have the results of your commands execute on the local machine, staging, or prod - this lets you build, run, and manage things using the same set of commands on different devices
- It lets you configure how containers talk to each other, so one key example is having an nginx + Let's Encrypt container that notices the creation of other webserver containers and automatically starts accepting requests for their domain, creates SSL certs, proxies requests etc. This greatly simplifies the deployment of websites (no messing around with systemd, nginx conf, and Let's Encrypt)

### How I use it
- I use [dstart](scripts/dstart.sh) on my development server to run my deno scripts (monitoring stuff) persistently. Another example might be a simple [appserver](appserver)
- I use [nginx-proxy](nginx) on my prod server, and deploy servers behind it so they get SSL and domains set up (see [webserver](webserver), and [socketserver](socketserver))


# Quick example

This walks you through taking a Deno script (myscript.js) and running it in a persistent way.

1. In the same directory as your script, create a file named 'Dockerfile' (case matters) containing:

        FROM denoland/deno:2.9.7
        EXPOSE 8000
        WORKDIR /app
        COPY . .
        RUN deno cache myscript.js
        USER deno
        CMD ["run", "--allow-net", "myscript.js"]

2. Build the image

        docker build . --tag myscript_img

3. Run the image

        docker run -d --name myscript --restart unless-stopped -p 8000:8000 myscript_img

    `-p 8000:8000` makes the container's port 8000 reachable on the host's port 8000 - `EXPOSE` on its own only documents it. Leave it off if your script doesn't serve anything.

You're done! If you have docker set up to run on system startup ("systemctl enable docker" on most Linux distros), then your script will start on startup and keep running. `docker logs -f myscript` shows its output.

# Setup (installing docker)
Follow the official instructions for your OS: https://docs.docker.com/engine/install/ (e.g. [Ubuntu](https://docs.docker.com/engine/install/ubuntu/)). Their package list includes `docker-compose-plugin`, which provides `docker compose`.

Then on Linux (https://docs.docker.com/engine/install/linux-postinstall/):

    # run docker without sudo (log out and back in afterwards) - anyone in the
    # docker group effectively has root on the machine
    sudo usermod -aG docker $USER

    # start docker on boot (the Debian/Ubuntu packages already do this)
    sudo systemctl enable docker

    # rotate container logs - otherwise they grow until the disk is full. Only
    # affects containers created after the restart (if you already have a
    # daemon.json, add the setting to it instead)
    echo '{ "log-driver": "local" }' | sudo tee /etc/docker/daemon.json
    sudo systemctl restart docker

# Project config

### Dockerfile:
This is the file that configures how your image is built. You need to put this in a file named 'Dockerfile' (case sensitive) in the same directory as your code:

    # pinned, so rebuilding next year doesn't silently upgrade Deno underneath you
    FROM denoland/deno:2.9.7
    EXPOSE 8000
    WORKDIR /app
    COPY . .
    # downloads the dependencies at build time, so they're baked into the image
    # and nothing is fetched when the container starts
    RUN deno cache myscript.js
    # the official image comes with an unprivileged user to run as
    USER deno
    CMD ["run", "--allow-net", "myscript.js"]

`COPY . .` copies everything in the directory into the image; list anything you don't want in there (`.git`, `.env`, etc.) in a [.dockerignore](https://docs.docker.com/build/concepts/context/#dockerignore-files) file.

### Context (remote server):
This lets you have all the consequences of your docker commands execute on a remote server (it also has to run docker).

1. Set up key-based auth on the local machine:

        ssh-keygen -t ed25519

        # linux / mac / WSL:
        ssh-copy-id [USER]@[YOUR_SERVER_HOSTNAME]

        # windows (PowerShell):
        type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh [USER]@[YOUR_SERVER_HOSTNAME] "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

2. Docker opens a lot of SSH connections; let them share one by adding this to ~/.ssh/config on the local machine (linux / mac - see [Docker's SSH tips](https://docs.docker.com/engine/security/protect-access/#ssh-tips)):

        ControlMaster     auto
        ControlPath       ~/.ssh/control-%C
        ControlPersist    yes

    sshd allows 10 sessions per connection by default, so if commands still fail when lots of them run at once, raise `MaxSessions` in /etc/ssh/sshd_config on the server.

3. Create a docker context for your production server (which must have Docker installed)

        docker context create prod --docker host=ssh://[USER]@[YOUR_SERVER_HOSTNAME]
        docker context use prod

    `docker context use` applies to every terminal and sticks until you run `docker context use default`. For one-off commands, `docker --context prod ...` is safer.

## Build + deploy:
This will build the image, and run it on the context

    docker build . --tag monmon_img
    docker run -d --name monmon --restart unless-stopped monmon_img

### Update:

    docker build . --tag monmon_img
    docker rm --force monmon
    docker run -d --name monmon --restart unless-stopped monmon_img
    docker image prune -f

`--restart unless-stopped` brings the container back after a crash or reboot, unless you stopped it with `docker stop` (`--restart always` restarts even those after a reboot).

## Build + deploy with docker compose
Docker compose lets you describe one or more containers and their configuration in a file, instead of as command line arguments, and run them together

### ./compose.yaml:

    services:
      web:
        restart: unless-stopped
        build: .
        container_name: monmon
        ports:
          - "8000:8000"

### run:

    docker compose up -d

### update/rebuild:

    docker compose up -d --build

`docker compose` picks up compose.yaml from the current directory; use `-f` for other names (e.g. `docker compose -f other.yaml up -d`). The old `docker-compose` command is no longer maintained.

### Occasionally update your images
The `FROM` versions are pinned, so updating is deliberate: change the version (e.g. to a newer [denoland/deno tag](https://hub.docker.com/r/denoland/deno/tags)) and rebuild. For unpinned images like `nginx:alpine`, `docker compose build --pull` fetches the newest one before building.

# Miscellaneous notes

* `docker ps -a` lists your containers (including stopped ones); `docker images` lists your images
* `docker logs -f [container]` (or `docker compose logs -f`) shows a container's output; `docker exec -it [container] sh` gets you a shell inside it
* [volumes](https://docs.docker.com/engine/storage/volumes/) keep data (databases, uploads) outside the container so it survives rebuilds
* If docker commands fail with credential helper errors (common over SSH or in WSL), remove the `credsStore` line from ~/.docker/config.json
