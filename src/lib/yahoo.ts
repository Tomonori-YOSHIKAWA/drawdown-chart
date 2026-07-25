import type { AssetDef } from "./symbols";
import type { PriceSeries } from "./types";

type YahooQuote = { close?: (number | null)[] | null };
type YahooAdjClose = { adjclose?: (number | null)[] | null };

type YahooResult = {
  meta?: { gmtoffset?: number | null } | null;
  timestamp?: number[] | null;
  indicators?: {
    quote?: YahooQuote[] | null;
    adjclose?: YahooAdjClose[] | null;
  } | null;
};

type YahooChartResponse = {
  chart?: {
    result?: YahooResult[] | null;
    error?: { code?: string; description?: string } | null;
  } | null;
};

export function buildChartUrl(ticker: string, range = "10y"): string {
  const params = new URLSearchParams({
    range,
    interval: "1d",
    includeAdjustedClose: "true",
  });
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${params}`;
}

/**
 * UNIX 秒を取引所ローカルの日付 (YYYY-MM-DD) にする。
 * Yahoo のタイムスタンプは大引け時刻の UTC 値なので、
 * gmtoffset を足してから UTC として日付を取れば取引日になる。
 */
function toLocalDate(unixSeconds: number, gmtOffsetSeconds: number): string {
  return new Date((unixSeconds + gmtOffsetSeconds) * 1000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Yahoo Finance chart API のレスポンスを列指向の価格系列に変換する。
 * 値が欠けている日は落とすので、dates / close / adjClose は常に同じ長さになる。
 */
export function parseYahooChart(
  raw: unknown,
  asset: AssetDef,
  updatedAt: string,
): PriceSeries {
  const body = raw as YahooChartResponse | null;
  const chart = body?.chart;
  if (!chart) {
    throw new Error(`${asset.ticker}: 想定外のレスポンス形式です`);
  }
  if (chart.error) {
    throw new Error(
      `${asset.ticker}: ${chart.error.description ?? chart.error.code ?? "unknown error"}`,
    );
  }

  const result = chart.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!result || !timestamps || !closes) {
    throw new Error(`${asset.ticker}: 価格データが含まれていません`);
  }

  const adjCloses = result.indicators?.adjclose?.[0]?.adjclose ?? null;
  const gmtOffset = result.meta?.gmtoffset ?? 0;

  const dates: string[] = [];
  const close: number[] = [];
  const adjClose: number[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (typeof c !== "number" || !Number.isFinite(c)) continue;

    const a = adjCloses?.[i];
    dates.push(toLocalDate(timestamps[i], gmtOffset));
    close.push(c);
    adjClose.push(typeof a === "number" && Number.isFinite(a) ? a : c);
  }

  if (dates.length === 0) {
    throw new Error(`${asset.ticker}: 有効な価格データが 0 件でした`);
  }

  return {
    id: asset.id,
    ticker: asset.ticker,
    name: asset.name,
    currency: asset.currency,
    dates,
    close,
    adjClose,
    updatedAt,
  };
}
