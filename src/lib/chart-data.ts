import type { DrawdownPoint } from "./types";

/** Recharts に渡す 1 行。銘柄 ID をキーにドローダウン (%) を持つ */
export type ChartRow = { date: string } & Record<string, number | string>;

export type SeriesInput = {
  id: string;
  points: readonly DrawdownPoint[];
};

/**
 * 複数銘柄のドローダウンを日付でそろえた行の配列にする。
 * 市場ごとに休場日が違うため日付は和集合を取り、
 * 値が無い日は「キーを置かない」ことで線を欠損として扱えるようにする。
 */
export function buildChartRows(series: readonly SeriesInput[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>();

  for (const { id, points } of series) {
    for (const point of points) {
      let row = byDate.get(point.date);
      if (!row) {
        row = { date: point.date };
        byDate.set(point.date, row);
      }
      row[id] = point.drawdown;
    }
  }

  // ISO 日付は辞書順が日付順と一致する
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}
