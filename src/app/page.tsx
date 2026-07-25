import { readFile } from "node:fs/promises";
import path from "node:path";
import DrawdownApp from "@/components/DrawdownApp";
import type { AssetIndex } from "@/lib/types";

/**
 * 銘柄一覧はビルド時に確定する静的データ。
 * fetch ではなくファイルから読むことで、ランタイムの外部依存をゼロにする。
 */
async function loadIndex(): Promise<AssetIndex> {
  const file = path.join(process.cwd(), "public", "data", "index.json");
  return JSON.parse(await readFile(file, "utf8")) as AssetIndex;
}

export default async function Page() {
  const index = await loadIndex();
  return <DrawdownApp index={index} />;
}
