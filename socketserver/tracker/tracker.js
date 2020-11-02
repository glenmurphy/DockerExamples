import { serve } from "https://deno.land/std@0.75.0/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
} from "https://deno.land/std@0.75.0/ws/mod.ts";

class Main {
  constructor(port) {
    this.port = port;
    this.startWS();
  }

  async startWS() {
    console.log(`websocket server is running on :${this.port}`);
    for await (const req of serve(`:${this.port}`)) {
      const { conn, r: bufReader, w: bufWriter, headers } = req;
      acceptWebSocket({
        conn,
        bufReader,
        bufWriter,
        headers,
      }).then(this.handleWS.bind(this))
        .catch(async (err) => {
          console.error(`failed to accept websocket: ${err}`);
          await req.respond({ status: 400 });
        });
    }
  }

  async handleWS(sock) {
    console.log("socket connected!");
    try {
      for await (const ev of sock) {
        if (typeof ev === "string") {
          // text message.
          console.log("ws:Text", ev);
          await sock.send(ev);
        } else if (ev instanceof Uint8Array) {
          // binary message.
          console.log("ws:Binary", ev);
        } else if (isWebSocketPingEvent(ev)) {
          const [, body] = ev;
          // ping.
          console.log("ws:Ping", body);
        } else if (isWebSocketCloseEvent(ev)) {
          // close.
          const { code, reason } = ev;
          console.log("ws:Close", code, reason);
        }
      }
    } catch (err) {
      console.error(`failed to receive frame: ${err}`);
  
      if (!sock.isClosed) {
        await sock.close(1000).catch(console.error);
      }
    }
  }
}


if (import.meta.main) {
  new Main(8004);
}