FROM hayd/deno:latest  
EXPOSE 80
WORKDIR /app
ADD . /app
RUN deno cache server.js
CMD ["run", "--allow-net", "server.js"]