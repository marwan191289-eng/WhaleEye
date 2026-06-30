import { binanceProxy } from "../lib/binance";

export const GET = async (event) => {
  const url = new URL(event.request.url);
  const path = url.searchParams.get("path");

  if (!path) {
    return new Response("Missing path", { status: 400 });
  }

  const data = await binanceProxy({ data: { path } });
  return Response.json(data);
};
