"use client";

import { formatDate, formatDays, formatPercent } from "@/lib/format";
import type { SeriesView } from "@/lib/types";

/**
 * チャートの数値をそのまま読める表。
 * 色が見分けにくい環境でも内容にたどり着けるようにするための代替ビューでもある。
 */
export default function StatsTable({
  series,
}: {
  series: readonly SeriesView[];
}) {
  if (series.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="sr-only">選択中の銘柄のドローダウン統計</caption>
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-ink-3">
            <th scope="col" className="py-2 pr-4 font-normal">
              銘柄
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">
              現在
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">
              最大
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">
              現在の水面下
            </th>
            {/* 起点 → 最大 → 回復 の時系列で並べる（下落の経過を左から読めるように） */}
            <th scope="col" className="py-2 pr-4 font-normal">
              最長下落の起点
            </th>
            <th scope="col" className="py-2 pr-4 font-normal">
              最大下落の発生日
            </th>
            <th scope="col" className="py-2 pr-4 font-normal">
              回復日
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              最長の水面下
            </th>
          </tr>
        </thead>
        <tbody>
          {series.map(({ id, color, asset, stats }) => (
            <tr key={id} className="border-b border-hairline last:border-0">
              <th scope="row" className="py-2 pr-4 font-normal">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-ink">{asset.name}</span>
                </span>
              </th>
              <td className="py-2 pr-4 text-right text-ink tnum">
                {formatPercent(stats?.current)}
              </td>
              <td className="py-2 pr-4 text-right text-ink tnum">
                {formatPercent(stats?.max)}
              </td>
              <td className="py-2 pr-4 text-right text-ink-2 tnum">
                {stats ? formatDays(stats.currentUnderwaterDays) : "—"}
              </td>
              <td className="py-2 pr-4 text-ink-2 tnum">
                {formatDate(stats?.maxPeakDate)}
              </td>
              <td className="py-2 pr-4 text-ink-2 tnum">
                {formatDate(stats?.maxDate)}
              </td>
              <td className="py-2 pr-4 text-ink-2 tnum">
                {stats == null
                  ? "—"
                  : stats.maxRecoveryDate === null
                    ? "未回復"
                    : formatDate(stats.maxRecoveryDate)}
              </td>
              <td className="py-2 text-right text-ink-2 tnum">
                {stats ? formatDays(stats.longestUnderwaterDays) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
