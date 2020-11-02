docker network create nginx-proxy
docker-compose -f nginx-proxy-compose.yaml up --force-recreate --build -d
docker-compose -f server-app-compose.yaml up --force-recreate --build -d