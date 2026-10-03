// A minimal WebSocket server: logs what it receives and echoes text messages back.
const PORT = 8004;

function handleSocket(socket) {
  socket.onopen = () => console.log("socket connected!");
  socket.onmessage = (event) => {
    if (typeof event.data === "string") {
      console.log("ws:Text", event.data);
      socket.send(event.data);
    } else {
      console.log("ws:Binary", event.data);
    }
  };
  socket.onclose = (event) => console.log("ws:Close", event.code, event.reason);
  socket.onerror = (event) => console.error("ws:Error", event.message);
}

Deno.serve({ port: PORT }, (req) => {
  if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("This server only accepts WebSocket connections\n", {
      status: 426,
      headers: { upgrade: "websocket" },
    });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  handleSocket(socket);
  return response;
});
