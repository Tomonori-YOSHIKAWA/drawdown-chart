"use client";

import { useEffect, useMemo, useState } from "react";
import AssetPicker from "./AssetPicker";
import DrawdownChart from "./DrawdownChart";
import Segmented from "./Segmented";
import SeriesLegend from "./SeriesLegend";
import StatsTable from "./StatsTable";
import ThemeToggle from "./ThemeToggle";
import { computeDrawdown, computeStats, sliceSeries } from "@/lib/drawdown";
import { formatDate } from "@/lib/format";
import { seriesColor } from "@/lib/palette";
import {
  initialAssignment,
  toggleAsset,
  type SlotAssignment,
} from "@/lib/selection";
import { DEFAULT_SELECTION, MAX_SERIES } from "@/lib/symbols";
import type {
  AssetIndex,
  PriceBasis,
  PriceSeries,
  RangeYears,
  SeriesView,
} from "@/lib/types";

const RANGE_OPTIONS: readonly { value: RangeYears; label: string }[] = [
  { value: 1, label: "1年" },
  { value: 3, label: "3年" },
  { value: 5, label: "5年" },
  { value: 10, label: "10年" },
  { value: null, label: "全期間" },
];

const BASIS_OPTIONS: readonly { value: PriceBasis; label: string }[] = [
  { value: "adjClose", label: "配当込み" },
  { value: "close", label: "価格のみ" },
];

export default function DrawdownApp({ index }: { index: AssetIndex }) {
  const [assignments, setAssignments] = useState<SlotAssignment[]>(() =>
    initialAssignment(DEFAULT_SELECTION, MAX_SERIES),
  );
  const [basis, setBasis] = useState<PriceBasis>("adjClose");
  const [range, setRange] = useState<RangeYears>(5);
  const [cache, setCache] = useState<Record<string, PriceSeries>>({});
  const [error, setError] = useState<string | null>(null);

  const assetById = useMemo(
    () => new Map(index.assets.map((a) => [a.id, a])),
    [index.assets],
  );

  const missing = useMemo(
    () => assignments.map((a) => a.id).filter((id) => !(id in cache)),
    [assignments, cache],
  );

  // 価格系列は 1 銘柄あたり数十 KB あるので、選択された銘柄だけ取りに行く
  useEffect(() => {
    if (missing.length === 0) return;

    let cancelled = false;

    Promise.all(
      missing.map(async (id) => {
        const res = await fetch(`/data/${id}.json`);
        if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
        return [id, (await res.json()) as PriceSeries] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setCache((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, [missing]);

  // 読み込み中は「未取得の銘柄がある」ことから導けるので、状態を別に持たない
  const loading = missing.length > 0 && error === null;

  const series = useMemo<SeriesView[]>(() => {
    // 選択順ではなくスロット順に並べ、銘柄を足しても既存の並びが動かないようにする
    return [...assignments]
      .sort((a, b) => a.slot - b.slot)
      .flatMap(({ id, slot }) => {
        const asset = assetById.get(id);
        if (!asset) return [];

        const base = { id, slot, color: seriesColor(slot), asset };
        const raw = cache[id];
        if (!raw) return [{ ...base, points: [], stats: null }];

        const { dates, prices } = sliceSeries(raw, basis, range);
        const points = computeDrawdown(dates, prices);
        return [{ ...base, points, stats: computeStats(points) }];
      });
  }, [assignments, assetById, cache, basis, range]);

  // 株価指数は配当を含まないので、配当込みを選んでも値が変わらない
  const priceOnlyAssets =
    basis === "adjClose"
      ? series.filter((s) => !s.asset.hasDividendAdjustment)
      : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ドローダウンチャート
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            主要インデックス・ETF が、過去最高値から何 % 下げているかの日次推移。
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="表示期間"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
        <Segmented
          label="価格の基準"
          options={BASIS_OPTIONS}
          value={basis}
          onChange={setBasis}
        />
        {loading && <span className="text-xs text-ink-3">読み込み中…</span>}
        {error && (
          <span className="text-xs text-ink-2">
            データを取得できませんでした（{error}）
          </span>
        )}
      </div>

      <AssetPicker
        assets={index.assets}
        assignments={assignments}
        maxSeries={MAX_SERIES}
        onToggle={(id) =>
          setAssignments((prev) => toggleAsset(prev, id, MAX_SERIES))
        }
      />

      <section className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4 sm:p-6">
        <h2 className="text-sm text-ink-2">
          最高値からの下落率（%・
          {range === null ? "全期間" : `直近 ${range} 年`}・
          {basis === "adjClose" ? "配当再投資込み" : "価格のみ"}）
        </h2>
        <DrawdownChart series={series} />
        {series.length >= 2 && <SeriesLegend series={series} />}
      </section>

      {/* 銘柄未選択のときは見出しと注記だけの空箱になるので、セクションごと出さない */}
      {series.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 sm:p-6">
          <h2 className="text-sm text-ink-2">統計</h2>
          <StatsTable series={series} />
          <p className="text-xs text-ink-3">
            「水面下」は最高値を更新できていない期間の長さ（暦日）。「最大下落の起点」「最大下落の発生日」「回復日」は、最大ドローダウンを記録した下落局面のものです（選択期間内で判定）。
          </p>
        </section>
      )}

      {priceOnlyAssets.length > 0 && (
        <p className="text-xs text-ink-3">
          {priceOnlyAssets.map((s) => s.asset.name).join("、")}
          は配当を含まない価格指数のため、「配当込み」を選んでも「価格のみ」と同じ値になります。
        </p>
      )}

      <footer className="mt-auto border-t border-hairline pt-4 text-xs text-ink-3">
        <p>
          データ出典: Yahoo Finance（最終更新 {formatDate(index.updatedAt.slice(0, 10))}・
          日次更新）。ドローダウンは表示期間内の最高値を起点に計算しています。
        </p>
        <p className="mt-1">
          本サイトは情報提供のみを目的としたもので、投資判断の助言ではありません。
        </p>
      </footer>
    </div>
  );
}
