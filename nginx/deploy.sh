#!/bin/bash
docker-compose -f nginx-proxy-compose.yaml up --force-recreate --build -d
