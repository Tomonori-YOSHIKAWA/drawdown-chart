/**
 * カテゴリカルパレットのスロット。
 * 順序は固定で、循環させない（9 系列目は作らず、選択数を上限で止める）。
 * 実際の色値は CSS 変数側でライト / ダークを切り替える。
 */
export const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
] as const;

export function seriesColor(slot: number): string {
  return SERIES_COLORS[slot % SERIES_COLORS.length];
}
