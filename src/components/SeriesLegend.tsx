"use client";

import { formatPercent } from "@/lib/format";
import type { SeriesView } from "@/lib/types";

/**
 * 色と銘柄名の対応を示す凡例。
 * 色だけで識別させないために、系列が 2 本以上なら常に出す。
 */
export default function SeriesLegend({
  series,
}: {
  series: readonly SeriesView[];
}) {
  if (series.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {series.map((s) => (
        <li key={s.id} className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: s.color }}
          />
          <span className="text-ink-2">{s.asset.name}</span>
          <span className="text-ink tnum">{formatPercent(s.stats?.current)}</span>
        </li>
      ))}
    </ul>
  );
}
