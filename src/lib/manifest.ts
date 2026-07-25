import type { AssetSummary } from "./types";

/**
 * 今回取得できた銘柄と前回の index.json を突き合わせる。
 * 日次更新では一部の銘柄だけ取得に失敗することがあり、そのたびに
 * index.json から銘柄が消えると UI から選択肢が丸ごと落ちてしまうため、
 * 失敗した銘柄は前回の内容（＝残っている JSON と整合する内容）を残す。
 */
export function mergeAssetSummaries(
  fresh: readonly AssetSummary[],
  previous: readonly AssetSummary[],
  order: readonly string[],
): AssetSummary[] {
  const byId = new Map(previous.map((a) => [a.id, a]));
  for (const asset of fresh) byId.set(asset.id, asset);

  // マスタに無い ID は、銘柄を入れ替えたときの残骸なので拾わない
  return order.flatMap((id) => {
    const asset = byId.get(id);
    return asset ? [asset] : [];
  });
}
