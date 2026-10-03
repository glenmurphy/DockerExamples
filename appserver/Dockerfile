FROM denoland/deno:2.9.7
EXPOSE 8000
WORKDIR /app
COPY . .
RUN deno cache server.js
USER deno
CMD ["run", "--allow-net", "server.js"]
