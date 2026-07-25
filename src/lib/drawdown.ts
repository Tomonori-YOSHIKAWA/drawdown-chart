import type {
  DrawdownPoint,
  DrawdownStats,
  PriceBasis,
  PriceSeries,
  RangeYears,
} from "./types";

/**
 * 浮動小数の誤差を落として小数第 2 位に丸める。
 * 80/100-1 が -0.19999999999999996 になるような誤差をそのまま表示・比較しないため。
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ISO 日付 (YYYY-MM-DD) 同士の暦日差 */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

/**
 * 各日の「期間内の過去最高値からの下落率 (%)」を求める。
 * 基準となる最高値は与えられた系列の中だけで計算するため、
 * 期間を絞った場合はその期間の高値が起点になる。
 */
export function computeDrawdown(
  dates: string[],
  prices: number[],
): DrawdownPoint[] {
  const points: DrawdownPoint[] = [];
  let peak = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < dates.length; i++) {
    const price = prices[i];
    if (!Number.isFinite(price) || price === null || price <= 0) continue;

    if (price > peak) peak = price;
    points.push({
      date: dates[i],
      price,
      peak,
      drawdown: round2((price / peak - 1) * 100),
    });
  }

  return points;
}

export function computeStats(points: DrawdownPoint[]): DrawdownStats | null {
  if (points.length === 0) return null;

  let maxIndex = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].drawdown < points[maxIndex].drawdown) maxIndex = i;
  }

  // 最大ドローダウンの起点 = その日以前で最後に高値を更新した日
  let maxPeakDate = points[0].date;
  for (let i = maxIndex; i >= 0; i--) {
    if (points[i].drawdown === 0) {
      maxPeakDate = points[i].date;
      break;
    }
  }

  // 回復日 = 最大ドローダウン以降で最初に高値を更新した日
  let maxRecoveryDate: string | null = null;
  for (let i = maxIndex + 1; i < points.length; i++) {
    if (points[i].drawdown === 0) {
      maxRecoveryDate = points[i].date;
      break;
    }
  }

  // 高値更新の間隔が水面下期間。最後の高値から現在までも候補に含める
  let lastPeakIndex = 0;
  let longestUnderwaterDays = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].drawdown !== 0) continue;
    longestUnderwaterDays = Math.max(
      longestUnderwaterDays,
      daysBetween(points[lastPeakIndex].date, points[i].date),
    );
    lastPeakIndex = i;
  }
  const last = points[points.length - 1];
  const currentUnderwaterDays = daysBetween(
    points[lastPeakIndex].date,
    last.date,
  );

  return {
    current: last.drawdown,
    max: points[maxIndex].drawdown,
    maxDate: points[maxIndex].date,
    maxPeakDate,
    maxRecoveryDate,
    currentUnderwaterDays,
    longestUnderwaterDays: Math.max(
      longestUnderwaterDays,
      currentUnderwaterDays,
    ),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 表示基準と期間で価格系列を切り出す。
 * 期間は「最終営業日から N 年前」を境界にする（現在日ではなくデータ末尾が基準）。
 */
export function sliceSeries(
  series: PriceSeries,
  basis: PriceBasis,
  years: RangeYears,
): { dates: string[]; prices: number[] } {
  const source = basis === "adjClose" ? series.adjClose : series.close;
  if (series.dates.length === 0) return { dates: [], prices: [] };
  if (years === null) {
    return { dates: [...series.dates], prices: [...source] };
  }

  const lastDate = series.dates[series.dates.length - 1];
  const [y, m, d] = lastDate.split("-").map(Number);
  // ISO 日付は辞書順が日付順と一致するので文字列比較で足りる
  const cutoff = `${y - years}-${pad2(m)}-${pad2(d)}`;
  const start = series.dates.findIndex((date) => date >= cutoff);
  if (start < 0) return { dates: [], prices: [] };

  return { dates: series.dates.slice(start), prices: source.slice(start) };
}
