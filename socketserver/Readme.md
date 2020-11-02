An example of how to develop and deploy a deno websocket server with an SSL HTML frontend using 
Docker, nginx-proxy, and letencrypt

### Development

    # run the tracker
    deno run --allow-net ./tracker/tracker.js

    # https://www.docker.com/blog/how-to-use-the-official-nginx-docker-image/
    # note the absolute path requirement for -v, and the lack of trailing slashes
    # this supports live editing of your HTML
    docker run -it --rm -d -p 8005:80 --name lfg -v "$PWD"/web:/usr/share/nginx/html nginx

    # Stop
    docker stop lfg

# Deployment
### set up remote access

    docker context create prod --docker host=ssh://[USERNAME]@[YOURHOST]
    docker context use prod

### set up nginx proxy on server (only needs to be done once ever)
see /Dropbox/Projects/system/nginx/

### edit your domains
edit docker-compose.yaml to contain the right domains - note the ws. subdomain on the tracker,
and how that lines up with the websocket connector in index.html

### deploy this server

    docker-compose -f docker-compose.yaml up --force-recreate --build -d