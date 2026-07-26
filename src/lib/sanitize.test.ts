import { describe, expect, it } from "vitest";
import { dropPriceOutliers } from "./sanitize";
import type { PriceSeries } from "./types";

function series(close: number[], adjClose: number[] = close): PriceSeries {
  return {
    id: "TEST",
    ticker: "TEST",
    name: "テスト",
    currency: "JPY",
    dates: close.map((_, i) => `2026-01-${String(i + 1).padStart(2, "0")}`),
    close: [...close],
    adjClose: [...adjClose],
    updatedAt: "2026-07-25T00:00:00.000Z",
  };
}

/** 100 前後で緩やかに動く、異常のない系列 */
function normal(length: number): number[] {
  return Array.from({ length }, (_, i) => 100 + (i % 5));
}

describe("dropPriceOutliers", () => {
  it("異常のない系列はそのまま返す", () => {
    const input = series(normal(20));
    const { series: output, removed } = dropPriceOutliers(input);

    expect(removed).toEqual([]);
    expect(output.close).toEqual(input.close);
    expect(output.dates).toEqual(input.dates);
  });

  it("1 日だけ桁が落ちた点を除去する", () => {
    const prices = normal(20);
    prices[10] = 10.2;

    const { series: output, removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual(["2026-01-11"]);
    expect(output.dates).toHaveLength(19);
    expect(output.close).not.toContain(10.2);
    expect(output.dates).not.toContain("2026-01-11");
  });

  it("連続 2 日の異常値も両方除去する", () => {
    const prices = normal(20);
    prices[10] = 10.2;
    prices[11] = 10.1;

    const { removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual(["2026-01-11", "2026-01-12"]);
  });

  it("上振れした異常値も除去する", () => {
    const prices = normal(20);
    prices[7] = 1000;

    const { removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual(["2026-01-08"]);
  });

  it("通常の暴落は残す", () => {
    // 1 日で -20%、その後も戻らない：実際に起こりうる値動き
    const prices = [...normal(10), ...normal(10).map((p) => p * 0.8)];

    const { removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual([]);
  });

  it("分割の取りこぼしのような水準の切り替わりは残す", () => {
    // 半値になったまま戻らない場合、異常値ではなく系列そのものの段差とみなす
    const prices = [...normal(10), ...normal(10).map((p) => p / 2)];

    const { removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual([]);
  });

  it("adjClose だけが壊れた日も除去する", () => {
    const close = normal(20);
    const adjClose = normal(20);
    adjClose[5] = 9.9;

    const { series: output, removed } = dropPriceOutliers(series(close, adjClose));

    expect(removed).toEqual(["2026-01-06"]);
    expect(output.close).toHaveLength(19);
    expect(output.adjClose).toHaveLength(19);
  });

  it("末尾の異常値も除去する（最新のドローダウンが狂うため）", () => {
    const prices = normal(20);
    prices[19] = 10.4;

    const { removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual(["2026-01-20"]);
  });

  it("先頭の異常値も除去する", () => {
    const prices = normal(20);
    prices[0] = 10.4;

    const { removed } = dropPriceOutliers(series(prices));

    expect(removed).toEqual(["2026-01-01"]);
  });

  it("点が少なすぎて判定できない系列はそのまま返す", () => {
    const { removed } = dropPriceOutliers(series([100]));

    expect(removed).toEqual([]);
  });

  it("除去後も dates / close / adjClose の長さが揃う", () => {
    const prices = normal(20);
    prices[3] = 5;
    prices[15] = 900;

    const { series: output } = dropPriceOutliers(series(prices));

    expect(output.close).toHaveLength(output.dates.length);
    expect(output.adjClose).toHaveLength(output.dates.length);
  });
});
