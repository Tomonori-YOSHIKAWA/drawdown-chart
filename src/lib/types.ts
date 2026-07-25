/**
 * 1 銘柄分の価格系列。
 * JSON の転送量を抑えるため、レコードの配列ではなく列指向で持つ
 * （2,500 点 × 15 銘柄でキー名の繰り返しが無視できないサイズになるため）。
 */
import type { AssetCategory } from "./symbols";

export type PriceSeries = {
  id: string;
  ticker: string;
  name: string;
  currency: string;
  /** ISO 日付 (YYYY-MM-DD) の昇順配列 */
  dates: string[];
  /** 終値。dates と同じ長さ */
  close: number[];
  /** 配当・分割調整後終値。dates と同じ長さ */
  adjClose: number[];
  /** データ生成時刻 (ISO 8601) */
  updatedAt: string;
};

/** public/data/index.json の 1 銘柄分。銘柄マスタに実データの範囲を足したもの */
export type AssetSummary = {
  id: string;
  ticker: string;
  name: string;
  category: AssetCategory;
  currency: string;
  hasDividendAdjustment: boolean;
  firstDate: string;
  lastDate: string;
  points: number;
};

export type AssetIndex = {
  updatedAt: string;
  assets: AssetSummary[];
};

export type PriceBasis = "adjClose" | "close";

/** 表示期間。null は全期間 */
export type RangeYears = 1 | 3 | 5 | 10 | null;

export type DrawdownPoint = {
  date: string;
  /** その時点の価格 */
  price: number;
  /** 期間内の過去最高値 */
  peak: number;
  /** 過去最高値からの下落率 (%)。0 以下の値 */
  drawdown: number;
};

export type DrawdownStats = {
  /** 直近のドローダウン (%) */
  current: number;
  /** 期間中の最大ドローダウン (%) */
  max: number;
  /** 最大ドローダウンを記録した日 */
  maxDate: string;
  /** 最大ドローダウンの起点となった最高値の日 */
  maxPeakDate: string;
  /** 最大ドローダウンから最高値を回復した日。未回復なら null */
  maxRecoveryDate: string | null;
  /** 直近の最高値更新からの経過日数（暦日） */
  currentUnderwaterDays: number;
  /** 期間中で最も長く最高値を下回り続けた日数（暦日） */
  longestUnderwaterDays: number;
};

/** チャート・凡例・統計表が共有する、描画済みの 1 系列 */
export type SeriesView = {
  id: string;
  /** 銘柄に固定された色スロット番号 */
  slot: number;
  /** CSS 変数参照。ライト / ダークの実値は CSS 側で切り替わる */
  color: string;
  asset: AssetSummary;
  points: DrawdownPoint[];
  /** データ未取得・空期間なら null */
  stats: DrawdownStats | null;
};
