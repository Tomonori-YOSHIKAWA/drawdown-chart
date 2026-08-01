# ドローダウンチャート

主要な株価指数・ETF の**最高値からの下落率（ドローダウン）**を日次で描画する Web アプリです。
「今の下落は過去と比べてどのくらいか」「あの暴落からの回復に何日かかったか」を、複数銘柄を重ねて比較できます。

## 機能

- 過去 10 年分の日次ドローダウンを折れ線で比較（最大 8 銘柄まで同時表示）
- 表示期間の切替（1 年 / 3 年 / 5 年 / 全期間）
- **配当再投資込み（調整後終値）と価格のみ（終値）の切替**
  株価指数は配当を含まない価格指数のため、どちらを選んでも結果は同じです（UI に注記あり）
- 統計テーブル（現在 / 最大のドローダウン、水面下の日数、最大下落の起点、最大下落の発生日、回復日）
- ライト / ダークテーマ切替（設定は localStorage に保存）

## 対象銘柄（12）

| カテゴリ | 銘柄 |
| --- | --- |
| 株価指数 | S&P 500 / NASDAQ 100 / NY ダウ / 日経平均株価 / TOPIX / 全世界株 (ACWI) |
| 高配当・増配 ETF | SCHD / VYM / VIG |
| 債券 | AGG / TLT |
| コモディティ | 金 (GLD) |

TOPIX と ACWI は指数そのものを取得できないため連動 ETF で代替していますが、見たいものは指数なので株価指数に分類しています。

銘柄の追加・削除は [`src/lib/symbols.ts`](src/lib/symbols.ts) の `ASSETS` を編集するだけで反映されます。

## データの仕組み

**ランタイムでの外部 API 依存はゼロ**です。ページは静的に生成され、価格データはリポジトリにコミットされた JSON を読むだけです。

```
GitHub Actions（火〜土 22:00 UTC = 米国市場のクローズ後）
  → Yahoo Finance から 10 年分の日次価格を取得
  → public/data/*.json にコミット
  → Vercel が自動で再デプロイ
```

- 一部の銘柄だけ取得に失敗しても、前回の `index.json` の内容を引き継ぐため銘柄が UI から消えません（[`src/lib/manifest.ts`](src/lib/manifest.ts)）
- 休場日で価格に変化がなければコミットせず、無駄な再デプロイを避けます
- 全銘柄で失敗した場合はワークフローを失敗させ、既存データを壊しません

ワークフローは [`.github/workflows/update-data.yml`](.github/workflows/update-data.yml) にあります。手動実行（workflow_dispatch）も可能です。

## 開発

```bash
npm install
npm run dev
```

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー（http://localhost:3000） |
| `npm run build` | 本番ビルド |
| `npm test` | Vitest でユニットテストを実行 |
| `npm run lint` | ESLint |
| `npm run fetch-data` | Yahoo Finance から価格を取得して `public/data/` を更新 |

## 構成

```
scripts/fetch-data.ts     価格取得スクリプト（GitHub Actions から実行）
src/lib/drawdown.ts       ドローダウン計算（累積最高値からの下落率）
src/lib/chart-data.ts     複数銘柄を1つのチャート用データに整形
src/lib/yahoo.ts          Yahoo Finance レスポンスのパース
src/lib/manifest.ts       index.json のマージ（取得失敗時の引き継ぎ）
src/lib/symbols.ts        銘柄マスタ
src/components/           UI コンポーネント
public/data/              取得済み価格データ（コミット対象）
```

計算ロジックは Vitest でテスト済みです（`*.test.ts`）。

## デプロイ

[Vercel](https://vercel.com/new) にリポジトリをインポートするだけです。Next.js が自動検出され、追加の環境変数は不要です。

## 注意事項

- 価格データは Yahoo Finance の非公開エンドポイントから取得しています。仕様変更で取得できなくなる可能性があります
- ドローダウンは**表示期間の開始時点を起点**として計算しています（期間を変えると最大ドローダウンの値も変わります）
- 本アプリは情報提供のみを目的としたもので、投資助言ではありません。データの正確性も保証しません
