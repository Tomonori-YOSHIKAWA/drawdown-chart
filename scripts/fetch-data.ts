import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { mergeAssetSummaries } from "../src/lib/manifest";
import { dropPriceOutliers } from "../src/lib/sanitize";
import { ASSETS, type AssetDef } from "../src/lib/symbols";
import { buildChartUrl, parseYahooChart } from "../src/lib/yahoo";
import type { AssetIndex, AssetSummary, PriceSeries } from "../src/lib/types";

const OUT_DIR = path.join(process.cwd(), "public", "data");
const RANGE = "10y";
/** Yahoo は User-Agent が無いリクエストを弾くことがある */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
/** 連続リクエストでレート制限に当たらないための間隔 */
const REQUEST_INTERVAL_MS = 800;
const MAX_RETRY = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** JSON のサイズを抑えるため、表示に不要な桁を落とす */
function round(values: number[], digits = 4): number[] {
  const factor = 10 ** digits;
  return values.map((v) => Math.round(v * factor) / factor);
}

async function fetchSeries(asset: AssetDef, updatedAt: string): Promise<PriceSeries> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await fetch(buildChartUrl(asset.ticker, RANGE), {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return parseYahooChart(await res.json(), asset, updatedAt);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRY) {
        // 指数バックオフ。一時的な 429 / 5xx を通り抜けるため
        await sleep(REQUEST_INTERVAL_MS * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** 初回実行では index.json が無いので、その場合は空として扱う */
async function readPreviousSummaries(): Promise<AssetSummary[]> {
  try {
    const raw = await readFile(path.join(OUT_DIR, "index.json"), "utf8");
    return (JSON.parse(raw) as AssetIndex).assets;
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const updatedAt = new Date().toISOString();
  await mkdir(OUT_DIR, { recursive: true });
  const previous = await readPreviousSummaries();

  const summaries: AssetSummary[] = [];
  const failures: string[] = [];

  for (const asset of ASSETS) {
    try {
      const raw = await fetchSeries(asset, updatedAt);
      const { series, removed } = dropPriceOutliers(raw);
      if (removed.length > 0) {
        console.warn(
          `WARN ${asset.ticker.padEnd(8)} 異常値 ${removed.length} 件を除外: ${removed.join(", ")}`,
        );
      }

      const compact: PriceSeries = {
        ...series,
        close: round(series.close),
        adjClose: round(series.adjClose),
      };

      await writeFile(
        path.join(OUT_DIR, `${asset.id}.json`),
        JSON.stringify(compact),
      );

      summaries.push({
        id: asset.id,
        ticker: asset.ticker,
        name: asset.name,
        category: asset.category,
        currency: asset.currency,
        hasDividendAdjustment: asset.hasDividendAdjustment,
        firstDate: series.dates[0],
        lastDate: series.dates[series.dates.length - 1],
        points: series.dates.length,
      });

      console.log(
        `OK   ${asset.ticker.padEnd(8)} ${series.dates.length} 点  ${series.dates[0]} → ${series.dates[series.dates.length - 1]}`,
      );
    } catch (error) {
      failures.push(asset.ticker);
      console.error(
        `FAIL ${asset.ticker.padEnd(8)} ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    await sleep(REQUEST_INTERVAL_MS);
  }

  if (summaries.length === 0) {
    // 全滅は API 仕様変更や遮断を疑うべき状態なので、既存データを壊さず失敗させる
    throw new Error("すべての銘柄で取得に失敗しました");
  }

  const assets = mergeAssetSummaries(
    summaries,
    previous,
    ASSETS.map((a) => a.id),
  );

  await writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify({ updatedAt, assets } satisfies AssetIndex, null, 2),
  );

  console.log(
    `\n成功 ${summaries.length} / ${ASSETS.length} 銘柄` +
      (failures.length > 0 ? `（失敗: ${failures.join(", ")}）` : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
