import { binanceProxy } from "../lib/binance";

export const route = {
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path");

    if (!path) {
      return new Response("Missing path", { status: 400 });
    }

    const data = await binanceProxy({ data: { path } });
    return Response.json(data);
  },
};
