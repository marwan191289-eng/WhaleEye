import { binanceProxy } from "../lib/binance";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  if (!query.path) {
    return { error: "Missing path" };
  }

  return await binanceProxy({ data: { path: query.path } });
});
