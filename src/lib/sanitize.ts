import type { PriceSeries } from "./types";

/** 外れ値判定に使う近傍の広さ（片側の点数） */
const WINDOW_RADIUS = 5;
/** 近傍の中央値に対するこの倍率を外れたら異常とみなす */
const UPPER_RATIO = 2;
const LOWER_RATIO = 0.5;

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isOutlier(value: number, reference: number): boolean {
  const ratio = value / reference;
  return ratio >= UPPER_RATIO || ratio <= LOWER_RATIO;
}

/**
 * i 番目が「前後の水準から浮いた 1 点」かどうか。
 *
 * 平均でなく中央値を基準にするのは、異常値が数日続いても基準が引きずられないため。
 * また前後どちらから見ても外れている場合だけ異常とするのは、株式分割の取りこぼしのような
 * 「以後ずっと水準が変わる」段差を消さないため（段差なら片側の中央値とは一致する）。
 */
function isSpike(values: readonly number[], i: number): boolean {
  const before = median(values.slice(Math.max(0, i - WINDOW_RADIUS), i));
  const after = median(values.slice(i + 1, i + 1 + WINDOW_RADIUS));

  // 端点は片側しか基準が無いが、最新日の異常は表示に直結するので片側だけで判定する
  if (before === null) return after !== null && isOutlier(values[i], after);
  if (after === null) return isOutlier(values[i], before);

  return isOutlier(values[i], before) && isOutlier(values[i], after);
}

/**
 * データ提供元が返す桁落ち（例: 382.7 → 37.64 が 2 日続いて元に戻る）を落とす。
 * 補間せず点ごと削除するのは、実際には存在しない値を作らないため。
 */
export function dropPriceOutliers(series: PriceSeries): {
  series: PriceSeries;
  removed: string[];
} {
  const keep: number[] = [];
  const removed: string[] = [];

  for (let i = 0; i < series.dates.length; i++) {
    if (isSpike(series.close, i) || isSpike(series.adjClose, i)) {
      removed.push(series.dates[i]);
    } else {
      keep.push(i);
    }
  }

  if (removed.length === 0) return { series, removed };

  return {
    series: {
      ...series,
      dates: keep.map((i) => series.dates[i]),
      close: keep.map((i) => series.close[i]),
      adjClose: keep.map((i) => series.adjClose[i]),
    },
    removed,
  };
}
