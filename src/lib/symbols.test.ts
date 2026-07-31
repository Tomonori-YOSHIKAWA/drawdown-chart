import { describe, expect, it } from "vitest";
import {
  ASSETS,
  CATEGORY_LABELS,
  DEFAULT_SELECTION,
  getAsset,
  type AssetCategory,
} from "./symbols";

describe("DEFAULT_SELECTION", () => {
  it("初期表示では何も選ばない", () => {
    // 初手で銘柄を押し付けず、比較したい銘柄だけを選ばせる
    expect(DEFAULT_SELECTION).toEqual([]);
  });
});

describe("ASSETS", () => {
  it("id が重複しない", () => {
    const ids = ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("id はファイル名・URL に使えるので記号を含まない", () => {
    for (const asset of ASSETS) {
      expect(asset.id).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it("全世界株と TOPIX は株価指数として扱う", () => {
    // 指数そのものが取得できないため ETF で代替している銘柄なので、
    // UI 上は「株式 ETF」ではなく指数の並びに置く
    expect(getAsset("ACWI")?.category).toBe<AssetCategory>("index");
    expect(getAsset("1306T")?.category).toBe<AssetCategory>("index");
  });

  it("指数と重複する ETF は持たない", () => {
    const ids = ASSETS.map((a) => a.id);
    expect(ids).not.toContain("VT");
    expect(ids).not.toContain("VOO");
    expect(ids).not.toContain("QQQ");
  });

  it("すべての銘柄のカテゴリに表示名がある", () => {
    for (const asset of ASSETS) {
      expect(CATEGORY_LABELS[asset.category]).toBeTruthy();
    }
  });

  it("表示名の無いカテゴリを残さない", () => {
    const used = new Set(ASSETS.map((a) => a.category));
    expect([...Object.keys(CATEGORY_LABELS)].sort()).toEqual(
      [...used].sort(),
    );
  });
});
