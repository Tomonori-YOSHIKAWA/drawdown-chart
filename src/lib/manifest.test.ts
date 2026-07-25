import { describe, expect, it } from "vitest";
import { mergeAssetSummaries } from "./manifest";
import type { AssetSummary } from "./types";

function summary(id: string, lastDate: string): AssetSummary {
  return {
    id,
    ticker: `^${id}`,
    name: id,
    category: "index",
    currency: "USD",
    hasDividendAdjustment: false,
    firstDate: "2016-07-25",
    lastDate,
    points: 100,
  };
}

describe("mergeAssetSummaries", () => {
  const order = ["A", "B", "C"];

  it("今回取得できた銘柄はそのまま採用する", () => {
    const fresh = [summary("A", "2026-07-24"), summary("B", "2026-07-24")];
    const merged = mergeAssetSummaries(fresh, [], order);

    expect(merged.map((a) => a.id)).toEqual(["A", "B"]);
    expect(merged[0].lastDate).toBe("2026-07-24");
  });

  it("取得に失敗した銘柄は前回の内容を引き継ぐ", () => {
    const fresh = [summary("A", "2026-07-24")];
    const previous = [summary("A", "2026-07-23"), summary("B", "2026-07-23")];

    const merged = mergeAssetSummaries(fresh, previous, order);

    expect(merged.map((a) => a.id)).toEqual(["A", "B"]);
    expect(merged[1].lastDate).toBe("2026-07-23");
  });

  it("マスタの順序で並べ直す", () => {
    const fresh = [summary("C", "2026-07-24"), summary("A", "2026-07-24")];

    expect(mergeAssetSummaries(fresh, [], order).map((a) => a.id)).toEqual([
      "A",
      "C",
    ]);
  });

  it("マスタから外された銘柄は前回分があっても落とす", () => {
    const previous = [summary("A", "2026-07-23"), summary("OLD", "2026-07-23")];

    expect(
      mergeAssetSummaries([], previous, order).map((a) => a.id),
    ).toEqual(["A"]);
  });
});
