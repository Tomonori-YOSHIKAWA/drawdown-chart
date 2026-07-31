export type AssetCategory = "index" | "dividend-etf" | "bond" | "commodity";

export type AssetDef = {
  /** Yahoo Finance のティッカー */
  ticker: string;
  /** ファイル名・URL に使う ID（`^` や `.` を含まない形に正規化したもの） */
  id: string;
  /** 表示名 */
  name: string;
  category: AssetCategory;
  currency: "USD" | "JPY";
  /**
   * 配当調整後終値が終値と異なるか。
   * 株価指数（S&P500 等）は配当を含まない価格指数なので、
   * Yahoo の調整後終値も終値と一致する。UI で注記するために保持する。
   */
  hasDividendAdjustment: boolean;
};

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  index: "株価指数",
  "dividend-etf": "高配当・増配 ETF",
  bond: "債券",
  commodity: "コモディティ",
};

export const ASSETS: readonly AssetDef[] = [
  // --- 株価指数 ---
  // 指数そのものを取得できない全世界株・TOPIX は連動 ETF で代替しているが、
  // 見たいものは指数なのでカテゴリはここに置く（配当調整の有無だけが指数と異なる）
  {
    ticker: "^GSPC",
    id: "GSPC",
    name: "S&P 500",
    category: "index",
    currency: "USD",
    hasDividendAdjustment: false,
  },
  {
    ticker: "^NDX",
    id: "NDX",
    name: "NASDAQ 100",
    category: "index",
    currency: "USD",
    hasDividendAdjustment: false,
  },
  {
    ticker: "^DJI",
    id: "DJI",
    name: "NY ダウ",
    category: "index",
    currency: "USD",
    hasDividendAdjustment: false,
  },
  {
    ticker: "^N225",
    id: "N225",
    name: "日経平均株価",
    category: "index",
    currency: "JPY",
    hasDividendAdjustment: false,
  },
  {
    // TOPIX 本体は Yahoo Finance から取得できないため、連動 ETF で代替する
    ticker: "1306.T",
    id: "1306T",
    name: "TOPIX ETF (1306)",
    category: "index",
    currency: "JPY",
    hasDividendAdjustment: true,
  },
  {
    // 同じく MSCI ACWI 本体は取得できないため、連動 ETF で代替する
    ticker: "ACWI",
    id: "ACWI",
    name: "全世界株 (ACWI)",
    category: "index",
    currency: "USD",
    hasDividendAdjustment: true,
  },

  // --- 高配当・増配 ETF ---
  {
    ticker: "SCHD",
    id: "SCHD",
    name: "米国高配当 (SCHD)",
    category: "dividend-etf",
    currency: "USD",
    hasDividendAdjustment: true,
  },
  {
    ticker: "VYM",
    id: "VYM",
    name: "米国高配当 (VYM)",
    category: "dividend-etf",
    currency: "USD",
    hasDividendAdjustment: true,
  },
  {
    ticker: "VIG",
    id: "VIG",
    name: "米国増配株 (VIG)",
    category: "dividend-etf",
    currency: "USD",
    hasDividendAdjustment: true,
  },

  // --- 債券 ---
  {
    ticker: "AGG",
    id: "AGG",
    name: "米国総合債券 (AGG)",
    category: "bond",
    currency: "USD",
    hasDividendAdjustment: true,
  },
  {
    ticker: "TLT",
    id: "TLT",
    name: "米国長期国債 (TLT)",
    category: "bond",
    currency: "USD",
    hasDividendAdjustment: true,
  },

  // --- コモディティ ---
  {
    ticker: "GLD",
    id: "GLD",
    name: "金 (GLD)",
    category: "commodity",
    currency: "USD",
    hasDividendAdjustment: false,
  },
] as const;

/**
 * 初期表示する銘柄。
 * 空にしてあるのは、何を比較したいかは人によって違うため。
 * 勝手に選んだ銘柄を外させるより、選ばせる方が手数が少ない。
 */
export const DEFAULT_SELECTION: readonly string[] = [];

/** 同時に表示できる系列数の上限（カテゴリカルパレットのスロット数） */
export const MAX_SERIES = 8;

const ASSET_BY_ID = new Map(ASSETS.map((a) => [a.id, a]));

export function getAsset(id: string): AssetDef | undefined {
  return ASSET_BY_ID.get(id);
}
