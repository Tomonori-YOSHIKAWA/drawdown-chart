import { describe, expect, it } from "vitest";
import { buildChartRows } from "./chart-data";
import type { DrawdownPoint } from "./types";

function point(date: string, drawdown: number): DrawdownPoint {
  return { date, price: 100, peak: 100, drawdown };
}

describe("buildChartRows", () => {
  it("系列が無ければ空配列を返す", () => {
    expect(buildChartRows([])).toEqual([]);
  });

  it("単一系列をそのまま行にする", () => {
    const rows = buildChartRows([
      { id: "A", points: [point("2024-01-02", 0), point("2024-01-03", -1.5)] },
    ]);
    expect(rows).toEqual([
      { date: "2024-01-02", A: 0 },
      { date: "2024-01-03", A: -1.5 },
    ]);
  });

  it("複数系列の日付を和集合にまとめる", () => {
    const rows = buildChartRows([
      { id: "A", points: [point("2024-01-02", 0), point("2024-01-03", -1)] },
      { id: "B", points: [point("2024-01-03", -2), point("2024-01-04", -3)] },
    ]);
    expect(rows).toEqual([
      { date: "2024-01-02", A: 0 },
      { date: "2024-01-03", A: -1, B: -2 },
      { date: "2024-01-04", B: -3 },
    ]);
  });

  it("値の無い日は系列のキーを持たない", () => {
    const rows = buildChartRows([
      { id: "A", points: [point("2024-01-02", 0)] },
      { id: "B", points: [point("2024-01-03", -2)] },
    ]);
    expect("B" in rows[0]).toBe(false);
    expect("A" in rows[1]).toBe(false);
  });

  it("入力の順序によらず日付昇順に並べる", () => {
    const rows = buildChartRows([
      { id: "A", points: [point("2024-01-04", -3), point("2024-01-02", 0)] },
    ]);
    expect(rows.map((r) => r.date)).toEqual(["2024-01-02", "2024-01-04"]);
  });

  it("空の系列が混ざっても他の系列を落とさない", () => {
    const rows = buildChartRows([
      { id: "A", points: [] },
      { id: "B", points: [point("2024-01-02", -1)] },
    ]);
    expect(rows).toEqual([{ date: "2024-01-02", B: -1 }]);
  });
});
