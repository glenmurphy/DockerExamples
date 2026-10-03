[nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) + [acme-companion](https://github.com/nginx-proxy/acme-companion): a reverse proxy that sends requests for each domain to the right container, and gets and renews Let's Encrypt certificates for them. Containers opt in through environment variables - see [appserver](../appserver), [webserver](../webserver), and [socketserver](../socketserver).

### Set up (once per server)
With your docker context pointing at the server:

    docker network create nginx-proxy
    ./deploy.sh

### Deploy a site behind it

    cd ../appserver
    docker compose -f server-app-compose.yaml up -d --build

What a site's compose file needs:
- `VIRTUAL_HOST`: the domain(s) nginx-proxy should send to it (comma separated)
- `ACME_HOST`: the domain(s) to get certificates for - their DNS has to point at the server already
- to be on the `nginx-proxy` network (the `networks:` block at the bottom of each example)

nginx-proxy forwards to the port the container `EXPOSE`s. Only set `VIRTUAL_PORT` (a port inside the container, not the public 443) if it exposes more than one. WebSockets work without any extra settings.

### Upgrade
The image versions are pinned in nginx-proxy-compose.yaml because their `latest` tags are builds of the main branch, not releases. To upgrade, change the versions (see the [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy/releases) and [acme-companion](https://github.com/nginx-proxy/acme-companion/releases) releases) and run `./deploy.sh` again.
