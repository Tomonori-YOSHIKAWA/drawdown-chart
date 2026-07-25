"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildChartRows, type ChartRow } from "@/lib/chart-data";
import { formatAxisDate, formatDate, formatPercent } from "@/lib/format";
import type { SeriesView } from "@/lib/types";

type Props = { series: readonly SeriesView[] };

type TooltipContentProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  series?: readonly SeriesView[];
};

/**
 * クロスヘア上の全系列をまとめて出すツールチップ。
 * 系列ごとに別々のツールチップを出すと、その日の比較ができないため。
 */
function ChartTooltip({ active, label, payload, series }: TooltipContentProps) {
  if (!active || !series || typeof label !== "string") return null;
  const row = payload?.[0]?.payload;
  if (!row) return null;

  const rows = series
    .map((s) => ({ s, value: row[s.id] }))
    .filter((r): r is { s: SeriesView; value: number } => typeof r.value === "number")
    // 浅い順に並べると、チャート上の線の重なり順と目線が一致する
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm shadow-lg">
      <div className="mb-1.5 text-xs text-ink-3 tnum">{formatDate(label)}</div>
      <ul className="flex flex-col gap-1">
        {rows.map(({ s, value }) => (
          <li key={s.id} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="mr-3 text-ink-2">{s.asset.name}</span>
            <span className="ml-auto text-ink tnum">{formatPercent(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DrawdownChart({ series }: Props) {
  const rows = useMemo(
    () => buildChartRows(series.map(({ id, points }) => ({ id, points }))),
    [series],
  );

  // 下端に少し余白を足してから 10% 単位に丸め、目盛をきりのいい値にする
  const yMin = useMemo(() => {
    let min = 0;
    for (const s of series) {
      for (const p of s.points) {
        if (p.drawdown < min) min = p.drawdown;
      }
    }
    return Math.floor((min - 2) / 10) * 10;
  }, [series]);

  if (rows.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-ink-3">
        銘柄を選ぶとチャートが表示されます
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full sm:h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--gridline)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            minTickGap={64}
            tickLine={false}
            axisLine={{ stroke: "var(--baseline)" }}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
          />
          <YAxis
            domain={[yMin, 0]}
            tickFormatter={(v: number) => `${v}%`}
            width={56}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke="var(--baseline)" />
          <Tooltip
            cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            content={<ChartTooltip series={series} />}
            isAnimationActive={false}
          />
          {series.map((s) => (
            <Line
              key={s.id}
              type="linear"
              dataKey={s.id}
              name={s.asset.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              // 市場ごとに休場日が違うので、欠損日は線を繋いで扱う
              connectNulls
              // 2,000 点超 × 8 系列でアニメーションは体感を損ねるだけ
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface-1)" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
