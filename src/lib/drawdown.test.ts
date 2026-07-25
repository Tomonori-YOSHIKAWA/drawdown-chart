import { describe, expect, it } from "vitest";
import { computeDrawdown, computeStats, sliceSeries } from "./drawdown";
import type { PriceSeries } from "./types";

describe("computeDrawdown", () => {
  it("空の系列では空配列を返す", () => {
    expect(computeDrawdown([], [])).toEqual([]);
  });

  it("最高値を更新し続ける間はドローダウンが 0 になる", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-02", "2024-01-03"],
      [100, 110, 120],
    );
    expect(points.map((p) => p.drawdown)).toEqual([0, 0, 0]);
    expect(points.map((p) => p.peak)).toEqual([100, 110, 120]);
  });

  it("過去最高値からの下落率を負のパーセントで返す", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-02", "2024-01-03"],
      [100, 80, 50],
    );
    expect(points.map((p) => p.drawdown)).toEqual([0, -20, -50]);
    expect(points.map((p) => p.peak)).toEqual([100, 100, 100]);
  });

  it("最高値を回復するとドローダウンが 0 に戻る", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
      [100, 50, 100, 120],
    );
    expect(points.map((p) => p.drawdown)).toEqual([0, -50, 0, 0]);
  });

  it("下落後に更新した高値が新しい基準になる", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
      [100, 80, 200, 100],
    );
    expect(points.map((p) => p.drawdown)).toEqual([0, -20, 0, -50]);
    expect(points[3].peak).toBe(200);
  });

  it("先頭が最高値でなくても、期間内の最高値のみを基準にする", () => {
    // 期間を切り出した結果、開始点が谷であっても期間外の高値は引きずらない
    const points = computeDrawdown(["2024-01-01", "2024-01-02"], [50, 60]);
    expect(points.map((p) => p.drawdown)).toEqual([0, 0]);
  });

  it("価格が欠損している日を除外する", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-02", "2024-01-03"],
      [100, Number.NaN, 90],
    );
    expect(points.map((p) => p.date)).toEqual(["2024-01-01", "2024-01-03"]);
    expect(points.map((p) => p.drawdown)).toEqual([0, -10]);
  });
});

describe("computeStats", () => {
  it("点が無い場合は null を返す", () => {
    expect(computeStats([])).toBeNull();
  });

  it("最大ドローダウンとその発生日・起点・回復日を返す", () => {
    const points = computeDrawdown(
      [
        "2024-01-01", // 100 (peak)
        "2024-01-02", // 90
        "2024-01-03", // 60 <- 最大 DD -40%
        "2024-01-04", // 80
        "2024-01-05", // 100 <- 回復
        "2024-01-06", // 95
      ],
      [100, 90, 60, 80, 100, 95],
    );
    const stats = computeStats(points);
    expect(stats).not.toBeNull();
    expect(stats!.max).toBe(-40);
    expect(stats!.maxDate).toBe("2024-01-03");
    expect(stats!.maxPeakDate).toBe("2024-01-01");
    expect(stats!.maxRecoveryDate).toBe("2024-01-05");
    expect(stats!.current).toBe(-5);
  });

  it("未回復なら回復日は null になる", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-02", "2024-01-03"],
      [100, 60, 70],
    );
    const stats = computeStats(points)!;
    expect(stats.max).toBe(-40);
    expect(stats.maxRecoveryDate).toBeNull();
    expect(stats.current).toBe(-30);
  });

  it("直近の最高値更新からの経過日数を暦日で数える", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-11", "2024-01-31"],
      [100, 90, 95],
    );
    const stats = computeStats(points)!;
    expect(stats.currentUnderwaterDays).toBe(30);
  });

  it("最高値を更新した日は水面下日数が 0 になる", () => {
    const points = computeDrawdown(
      ["2024-01-01", "2024-01-11", "2024-01-31"],
      [100, 90, 120],
    );
    const stats = computeStats(points)!;
    expect(stats.currentUnderwaterDays).toBe(0);
    expect(stats.current).toBe(0);
  });

  it("最長の水面下期間を返す", () => {
    const points = computeDrawdown(
      [
        "2024-01-01", // 100 peak
        "2024-02-01", // 90
        "2024-03-01", // 110 peak (水面下 60 日)
        "2024-03-08", // 100
        "2024-03-15", // 120 peak (水面下 14 日)
      ],
      [100, 90, 110, 100, 120],
    );
    const stats = computeStats(points)!;
    expect(stats.longestUnderwaterDays).toBe(60);
  });

  it("小数の丸め誤差を含まない値を返す", () => {
    const points = computeDrawdown(["2024-01-01", "2024-01-02"], [3, 1]);
    const stats = computeStats(points)!;
    // -66.666... が -66.67 に丸められる
    expect(stats.max).toBe(-66.67);
  });
});

describe("sliceSeries", () => {
  const series: PriceSeries = {
    id: "TEST",
    ticker: "TEST",
    name: "テスト",
    currency: "USD",
    dates: ["2020-01-01", "2022-01-01", "2024-01-01", "2025-01-01"],
    close: [10, 20, 30, 40],
    adjClose: [1, 2, 3, 4],
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  it("基準に応じて close / adjClose を選ぶ", () => {
    expect(sliceSeries(series, "close", null).prices).toEqual([10, 20, 30, 40]);
    expect(sliceSeries(series, "adjClose", null).prices).toEqual([1, 2, 3, 4]);
  });

  it("最終日から指定年数分だけ切り出す", () => {
    const sliced = sliceSeries(series, "close", 3);
    // 最終日 2025-01-01 の 3 年前 = 2022-01-01 以降
    expect(sliced.dates).toEqual(["2022-01-01", "2024-01-01", "2025-01-01"]);
    expect(sliced.prices).toEqual([20, 30, 40]);
  });

  it("全期間指定ではすべて返す", () => {
    expect(sliceSeries(series, "close", null).dates).toHaveLength(4);
  });

  it("空の系列でも落ちない", () => {
    const empty: PriceSeries = { ...series, dates: [], close: [], adjClose: [] };
    expect(sliceSeries(empty, "close", 1)).toEqual({ dates: [], prices: [] });
  });
});
