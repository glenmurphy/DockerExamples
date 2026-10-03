An example of how to develop and deploy a deno websocket server with an SSL HTML frontend using
Docker, nginx-proxy, and Let's Encrypt

### Development

    # run the tracker
    deno run --allow-net ./tracker/tracker.js

    # serve the HTML with nginx (https://www.docker.com/blog/how-to-use-the-official-nginx-docker-image/)
    # mounting web/ into the container supports live editing of your HTML
    docker run --rm -d -p 8005:80 --name lfg -v ./web:/usr/share/nginx/html:ro nginx:alpine

    # open http://localhost:8005 - over plain http, the page connects to the tracker on port 8004

    # Stop
    docker stop lfg

# Deployment
### set up remote access

    docker context create prod --docker host=ssh://[USERNAME]@[YOURHOST]
    docker context use prod

### set up nginx proxy on server (only needs to be done once ever)
see [nginx](../nginx)

### edit your domains
edit docker-compose.yaml to contain the right domains - note the ws. subdomain on the tracker,
and how that lines up with the websocket URL in web/index.html (over https, the page connects to
wss://ws.[its own hostname])

### deploy this server

    docker compose up -d --build
