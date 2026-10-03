// nginx-proxy forwards to port 8000 because it's the only port the Dockerfile EXPOSEs
Deno.serve({ port: 8000 }, () => new Response("Hello World\n"));
