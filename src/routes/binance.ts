import { binanceProxy } from "../lib/binance";

export const GET = async (event) => {
  return binanceProxy({ data: { path: event.request.url.split("/binance")[1] } });
};
