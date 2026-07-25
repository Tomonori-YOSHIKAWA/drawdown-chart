import { describe, expect, it } from "vitest";
import { parseYahooChart } from "./yahoo";
import type { AssetDef } from "./symbols";

const asset: AssetDef = {
  ticker: "TEST",
  id: "TEST",
  name: "テスト",
  category: "index",
  currency: "USD",
  hasDividendAdjustment: true,
};

const UPDATED_AT = "2024-06-01T00:00:00.000Z";

/** 2024-01-02 16:00 (ET, UTC-5) = 2024-01-02T21:00:00Z */
const ET_CLOSE_20240102 = Date.UTC(2024, 0, 2, 21) / 1000;
const ET_CLOSE_20240103 = Date.UTC(2024, 0, 3, 21) / 1000;
const ET_CLOSE_20240104 = Date.UTC(2024, 0, 4, 21) / 1000;

function buildResponse(options: {
  timestamp: number[];
  close: (number | null)[];
  adjclose?: (number | null)[];
  gmtoffset?: number;
}) {
  return {
    chart: {
      result: [
        {
          meta: { gmtoffset: options.gmtoffset ?? -18000, currency: "USD" },
          timestamp: options.timestamp,
          indicators: {
            quote: [{ close: options.close }],
            ...(options.adjclose
              ? { adjclose: [{ adjclose: options.adjclose }] }
              : {}),
          },
        },
      ],
      error: null,
    },
  };
}

describe("parseYahooChart", () => {
  it("タイムスタンプを取引所ローカルの取引日に変換する", () => {
    const series = parseYahooChart(
      buildResponse({
        timestamp: [ET_CLOSE_20240102, ET_CLOSE_20240103],
        close: [100, 101],
        adjclose: [99, 100],
      }),
      asset,
      UPDATED_AT,
    );
    expect(series.dates).toEqual(["2024-01-02", "2024-01-03"]);
    expect(series.close).toEqual([100, 101]);
    expect(series.adjClose).toEqual([99, 100]);
  });

  it("東京市場 (UTC+9) の大引けも同じ日付になる", () => {
    // 2024-01-04 15:00 JST = 2024-01-04T06:00:00Z
    const jstClose = Date.UTC(2024, 0, 4, 6) / 1000;
    const series = parseYahooChart(
      buildResponse({
        timestamp: [jstClose],
        close: [30000],
        gmtoffset: 32400,
      }),
      { ...asset, currency: "JPY" },
      UPDATED_AT,
    );
    expect(series.dates).toEqual(["2024-01-04"]);
  });

  it("調整後終値が無い指数では終値をそのまま使う", () => {
    const series = parseYahooChart(
      buildResponse({
        timestamp: [ET_CLOSE_20240102],
        close: [4700.5],
      }),
      asset,
      UPDATED_AT,
    );
    expect(series.adjClose).toEqual([4700.5]);
  });

  it("価格が null の日を取り除く", () => {
    const series = parseYahooChart(
      buildResponse({
        timestamp: [ET_CLOSE_20240102, ET_CLOSE_20240103, ET_CLOSE_20240104],
        close: [100, null, 102],
        adjclose: [100, null, 102],
      }),
      asset,
      UPDATED_AT,
    );
    expect(series.dates).toEqual(["2024-01-02", "2024-01-04"]);
    expect(series.close).toEqual([100, 102]);
  });

  it("調整後終値だけ欠けている日は終値で補う", () => {
    const series = parseYahooChart(
      buildResponse({
        timestamp: [ET_CLOSE_20240102, ET_CLOSE_20240103],
        close: [100, 102],
        adjclose: [100, null],
      }),
      asset,
      UPDATED_AT,
    );
    expect(series.adjClose).toEqual([100, 102]);
  });

  it("銘柄マスタの情報を系列に載せる", () => {
    const series = parseYahooChart(
      buildResponse({ timestamp: [ET_CLOSE_20240102], close: [100] }),
      asset,
      UPDATED_AT,
    );
    expect(series.id).toBe("TEST");
    expect(series.ticker).toBe("TEST");
    expect(series.name).toBe("テスト");
    expect(series.currency).toBe("USD");
    expect(series.updatedAt).toBe(UPDATED_AT);
  });

  it("API がエラーを返したら例外を投げる", () => {
    expect(() =>
      parseYahooChart(
        {
          chart: {
            result: null,
            error: { code: "Not Found", description: "No data found" },
          },
        },
        asset,
        UPDATED_AT,
      ),
    ).toThrow(/No data found/);
  });

  it("結果が空なら例外を投げる", () => {
    expect(() =>
      parseYahooChart({ chart: { result: [], error: null } }, asset, UPDATED_AT),
    ).toThrow(/TEST/);
  });

  it("有効な価格が 1 件も無ければ例外を投げる", () => {
    expect(() =>
      parseYahooChart(
        buildResponse({ timestamp: [ET_CLOSE_20240102], close: [null] }),
        asset,
        UPDATED_AT,
      ),
    ).toThrow(/価格データ/);
  });

  it("想定外の形の JSON では例外を投げる", () => {
    expect(() => parseYahooChart({ foo: "bar" }, asset, UPDATED_AT)).toThrow();
    expect(() => parseYahooChart(null, asset, UPDATED_AT)).toThrow();
  });
});
