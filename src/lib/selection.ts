/** 銘柄 ID と、その銘柄に固定された色スロット番号 (0 始まり) の対応 */
export type SlotAssignment = {
  id: string;
  slot: number;
};

/**
 * まだ使われていない最小のスロット番号。
 * 選択を外して空いた番号を再利用するので、常に若い番号から埋まる。
 */
function firstFreeSlot(current: readonly SlotAssignment[]): number {
  const used = new Set(current.map((a) => a.slot));
  let slot = 0;
  while (used.has(slot)) slot++;
  return slot;
}

export function initialAssignment(
  ids: readonly string[],
  maxSeries: number,
): SlotAssignment[] {
  return ids.slice(0, maxSeries).map((id, index) => ({ id, slot: index }));
}

/**
 * 銘柄の選択を切り替える。
 * 色はエンティティに固定する規約なので、選択を外しても
 * 残った銘柄のスロットは並べ直さない。
 */
export function toggleAsset(
  current: readonly SlotAssignment[],
  id: string,
  maxSeries: number,
): SlotAssignment[] {
  const selected = current.some((a) => a.id === id);
  if (selected) {
    return current.filter((a) => a.id !== id);
  }
  // 上限に達している場合は参照ごと据え置き、無用な再レンダリングを避ける
  if (current.length >= maxSeries) return current as SlotAssignment[];

  return [...current, { id, slot: firstFreeSlot(current) }];
}

export function slotOf(
  current: readonly SlotAssignment[],
  id: string,
): number | null {
  return current.find((a) => a.id === id)?.slot ?? null;
}
