import { describe, expect, it } from "vitest";
import { initialAssignment, slotOf, toggleAsset } from "./selection";

const MAX = 4;

describe("initialAssignment", () => {
  it("与えた順にスロット 0 から割り当てる", () => {
    expect(initialAssignment(["A", "B"], MAX)).toEqual([
      { id: "A", slot: 0 },
      { id: "B", slot: 1 },
    ]);
  });

  it("上限を超える分は切り捨てる", () => {
    const result = initialAssignment(["A", "B", "C", "D", "E"], MAX);
    expect(result.map((a) => a.id)).toEqual(["A", "B", "C", "D"]);
  });

  it("空の指定では空を返す", () => {
    expect(initialAssignment([], MAX)).toEqual([]);
  });
});

describe("toggleAsset", () => {
  it("未選択の銘柄を空きスロット付きで末尾に追加する", () => {
    expect(toggleAsset([{ id: "A", slot: 0 }], "B", MAX)).toEqual([
      { id: "A", slot: 0 },
      { id: "B", slot: 1 },
    ]);
  });

  it("選択済みの銘柄を外す", () => {
    const current = [
      { id: "A", slot: 0 },
      { id: "B", slot: 1 },
    ];
    expect(toggleAsset(current, "A", MAX)).toEqual([{ id: "B", slot: 1 }]);
  });

  it("外しても残った銘柄のスロットは変わらない", () => {
    const current = [
      { id: "A", slot: 0 },
      { id: "B", slot: 1 },
      { id: "C", slot: 2 },
    ];
    // 色はエンティティに固定なので、系列数が減っても塗り替えない
    expect(toggleAsset(current, "B", MAX)).toEqual([
      { id: "A", slot: 0 },
      { id: "C", slot: 2 },
    ]);
  });

  it("空いたスロットを次の選択で再利用する", () => {
    const current = [
      { id: "A", slot: 0 },
      { id: "C", slot: 2 },
    ];
    expect(toggleAsset(current, "D", MAX)).toEqual([
      { id: "A", slot: 0 },
      { id: "C", slot: 2 },
      { id: "D", slot: 1 },
    ]);
  });

  it("上限に達したら追加せず元の配列をそのまま返す", () => {
    const current = [
      { id: "A", slot: 0 },
      { id: "B", slot: 1 },
      { id: "C", slot: 2 },
      { id: "D", slot: 3 },
    ];
    expect(toggleAsset(current, "E", MAX)).toBe(current);
  });

  it("上限に達していても選択済みの銘柄は外せる", () => {
    const current = [
      { id: "A", slot: 0 },
      { id: "B", slot: 1 },
      { id: "C", slot: 2 },
      { id: "D", slot: 3 },
    ];
    expect(toggleAsset(current, "C", MAX).map((a) => a.id)).toEqual([
      "A",
      "B",
      "D",
    ]);
  });
});

describe("slotOf", () => {
  it("選択中の銘柄のスロットを返す", () => {
    expect(slotOf([{ id: "A", slot: 3 }], "A")).toBe(3);
  });

  it("未選択なら null を返す", () => {
    expect(slotOf([{ id: "A", slot: 3 }], "B")).toBeNull();
  });
});
