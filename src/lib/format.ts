/** 値が無いことを示す記号。表を空欄にすると欠測か 0 か区別できないため */
const EMPTY = "—";

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  return `${value.toFixed(2)}%`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return EMPTY;
  return date.replaceAll("-", "/");
}

/** 軸の目盛は年月まで。日まで出すと目盛が詰まって読めない */
export function formatAxisDate(date: string): string {
  return date.slice(0, 7).replace("-", "/");
}

export function formatDays(days: number): string {
  return `${days.toLocaleString("ja-JP")}日`;
}
