"use client";

import { seriesColor } from "@/lib/palette";
import { slotOf, type SlotAssignment } from "@/lib/selection";
import { CATEGORY_LABELS, type AssetCategory } from "@/lib/symbols";
import type { AssetSummary } from "@/lib/types";

type Props = {
  assets: readonly AssetSummary[];
  assignments: readonly SlotAssignment[];
  maxSeries: number;
  onToggle: (id: string) => void;
};

const CATEGORY_ORDER: AssetCategory[] = [
  "index",
  "dividend-etf",
  "bond",
  "commodity",
];

export default function AssetPicker({
  assets,
  assignments,
  maxSeries,
  onToggle,
}: Props) {
  const atLimit = assignments.length >= maxSeries;

  return (
    <div className="flex flex-col gap-3">
      {CATEGORY_ORDER.map((category) => {
        const group = assets.filter((a) => a.category === category);
        if (group.length === 0) return null;

        return (
          <div key={category} className="flex flex-wrap items-center gap-2">
            <span className="w-full text-xs text-ink-3 sm:w-36 sm:shrink-0">
              {CATEGORY_LABELS[category]}
            </span>
            {group.map((asset) => {
              const slot = slotOf(assignments, asset.id);
              const selected = slot !== null;
              // 上限に達したら未選択の銘柄は押せない（9 色目を作らないため）
              const disabled = !selected && atLimit;

              return (
                <button
                  key={asset.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => onToggle(asset.id)}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    selected
                      ? "border-hairline bg-surface text-ink"
                      : "border-hairline text-ink-2 hover:text-ink",
                    disabled ? "cursor-not-allowed opacity-40" : "",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      background: selected ? seriesColor(slot) : "var(--baseline)",
                    }}
                  />
                  {asset.name}
                </button>
              );
            })}
          </div>
        );
      })}
      <p className="text-xs text-ink-3">
        最大 {maxSeries} 銘柄まで同時に表示できます（現在 {assignments.length} 銘柄）。
      </p>
    </div>
  );
}
