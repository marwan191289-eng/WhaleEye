// Binance public market data — no API key needed.
// REST calls go through a TanStack Start server function (binanceProxy) so the
// actual request to api.binance.com happens server-side, on the Vercel function.
// Binance's REST API does NOT send Access-Control-Allow-Origin, so a direct
// browser fetch is blocked by CORS in production — this proxy avoids that
// entirely (server-to-server requests aren't subject to CORS) and works
// identically in local dev and on Vercel, no environment branching needed.

import { createServerFn } from "@tanstack/react-start";

const BINANCE_BASE = "https://api.binance.com";

export const binanceProxy = createServerFn({ method: "GET" })
  .validator((d: { path: string }) => d)
  .handler(async ({ data }) => {
    const r = await fetch(`${BINANCE_BASE}${data.path}`);
    if (!r.ok) {
      throw new Error(`binance ${r.status}`);
    }
    return r.json();
  });

export const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "LTCUSDT",
  "BCHUSDT",
  "AAVEUSDT",
  "ETCUSDT",
  "SLXUSDT",
] as const;

export type Symbol = (typeof SYMBOLS)[number];

export const TIMEFRAMES = [
  { label: "1د", value: "1m" },
  { label: "5د", value: "5m" },
  { label: "15د", value: "15m" },
  { label: "1س", value: "1h" },
  { label: "4س", value: "4h" },
  { label: "يومي", value: "1d" },
  { label: "أسبوعي", value: "1w" },
] as const;

export type Interval = (typeof TIMEFRAMES)[number]["value"];

export interface DepthLevel {
  price: number;
  qty: number;
}

export interface OrderBook {
  bids: DepthLevel[];
  asks: DepthLevel[];
  lastUpdateId: number;
}

export interface Ticker {
  symbol: string;
  last: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

// ── REST helpers ───────────────────────────────────────────────────────────
async function binanceGet(path: string): Promise<any> {
  return binanceProxy({ data: { path } });
}

export function wsUrl(stream: string) {
  // Binance's public WS market stream accepts direct browser connections from
  // any origin (this is its documented intended usage), so unlike REST it
  // does not need a server-side proxy.
  return `wss://stream.binance.com:9443/ws/${stream}`;
}

export async function fetchDepth(symbol: string, limit = 500): Promise<OrderBook> {
  const j = await binanceGet(`/api/v3/depth?symbol=${symbol}&limit=${limit}`);
  return {
    lastUpdateId: j.lastUpdateId,
    bids: (j.bids as [string, string][]).map(([p, q]) => ({ price: +p, qty: +q })),
    asks: (j.asks as [string, string][]).map(([p, q]) => ({ price: +p, qty: +q })),
  };
}

export async function fetchTicker(symbol: string): Promise<Ticker> {
  const j = await binanceGet(`/api/v3/ticker/24hr?symbol=${symbol}`);
  return {
    symbol: j.symbol,
    last: +j.lastPrice,
    change: +j.priceChange,
    changePct: +j.priceChangePercent,
    high: +j.highPrice,
    low: +j.lowPrice,
    volume: +j.volume,
    quoteVolume: +j.quoteVolume,
  };
}

export async function fetchAllTickers(symbols: readonly string[]): Promise<Ticker[]> {
  const param = encodeURIComponent(JSON.stringify(symbols));
  const arr = (await binanceGet(`/api/v3/ticker/24hr?symbols=${param}`)) as any[];
  return arr.map((j) => ({
    symbol: j.symbol,
    last: +j.lastPrice,
    change: +j.priceChange,
    changePct: +j.priceChangePercent,
    high: +j.highPrice,
    low: +j.lowPrice,
    volume: +j.volume,
    quoteVolume: +j.quoteVolume,
  }));
}

export async function fetchKlines(
  symbol: string,
  interval: Interval,
  limit = 200
): Promise<Kline[]> {
  const arr = (await binanceGet(
    `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  )) as any[][];
  return arr.map((k) => ({
    openTime: k[0],
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4],
    volume: +k[5],
    closeTime: k[6],
  }));
}

// ── Formatters ─────────────────────────────────────────────────────────────
export function fmtPrice(n: number, decimals?: number): string {
  if (!isFinite(n)) return "—";
  const d =
    decimals ??
    (n >= 1000 ? 2 : n >= 10 ? 3 : n >= 1 ? 4 : n >= 0.01 ? 5 : 6);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function fmtUsd(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function fmtQty(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(n >= 1 ? 2 : 4);
}

export function fmtPct(n: number, digits = 2): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(digits)}%`;
}
