import { createServerFn } from "@tanstack/react-start";

export const wsProxy = createServerFn({ method: "GET" })
  .validator((d: { stream: string }) => d)
  .handler(async ({ data }) => {
    const stream = data.stream;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

    return new Response(
      new ReadableStream({
        start(controller) {
          ws.onmessage = (msg) => controller.enqueue(msg.data);
          ws.onerror = () => controller.close();
          ws.onclose = () => controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      }
    );
  });
