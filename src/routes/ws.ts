import { defineEventHandler, getQuery } from "h3";
import WebSocket from "ws";

export default defineEventHandler((event) => {
  const { stream } = getQuery(event);

  if (!stream) {
    event.node.res.statusCode = 400;
    return "Missing stream";
  }

  const binanceWS = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

  const { req, res } = event.node;

  if (req.headers.upgrade !== "websocket") {
    res.statusCode = 426;
    return "Expected WebSocket";
  }

  const serverWS = new WebSocket.Server({ noServer: true });

  event.node.req.socket.server.on("upgrade", (request, socket, head) => {
    serverWS.handleUpgrade(request, socket, head, (clientWS) => {
      binanceWS.on("message", (msg) => clientWS.send(msg));
      binanceWS.on("close", () => clientWS.close());
      binanceWS.on("error", () => clientWS.close());

      clientWS.on("message", (msg) => binanceWS.send(msg));
      clientWS.on("close", () => binanceWS.close());
    });
  });

  return null;
});
